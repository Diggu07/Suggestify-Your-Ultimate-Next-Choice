import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import cors from "cors";
import bodyParser from "body-parser";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import ollama from "ollama";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ----------------------------------------
// STATIC FRONTEND HOSTING
// ----------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "../frontend")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/templates/login_page.html"));
});

// ----------------------------------------
// MONGO CONNECTION
// ----------------------------------------
const PORT = 5000;
const MONGO_URI = "mongodb://localhost:27017";
const DB_NAME = "media";

let db,
  usersCollection,
  contentCollection,
  questionsCollection,
  leaderboardCollection,
  resultsCollection;

function sha256hex(s) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

async function init() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  db = client.db(DB_NAME);

  usersCollection = db.collection("users");
  contentCollection = db.collection("content");
  questionsCollection = db.collection("quiz_questions");
  leaderboardCollection = db.collection("leaderboard");
  resultsCollection = db.collection("quiz_results");

  console.log("✅ Connected to MongoDB (media)");
}
init().catch((err) => console.error("Mongo init error:", err));

// ============================================================================
//                               WEB AUTH (LOGIN & REGISTER)
// ============================================================================
app.post("/api/register", async (req, res) => {
  const { username, password, email } = req.body;

  if (!username || !password)
    return res.status(400).json({ error: "username & password required" });

  const exists = await usersCollection.findOne({ username });
  if (exists) return res.status(409).json({ error: "username already exists" });

  const hash = sha256hex(password);

  await usersCollection.insertOne({
    username,
    password: hash,
    email: email || "",
    fullname: username,
    createdAt: new Date(),

    stats: { completed: 0, favorites: 0, watchlist: 0 },
    achievements: [],
    watchlist: [],
    preferences: {
      emailNotifications: true,
      pushNotifications: true,
      autoPlayTrailers: true,
      darkMode: true,
    },
  });

  res.json({ status: "ok" });
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  const hash = sha256hex(password);

  const user = await usersCollection.findOne({
    $and: [{ password: hash }, { $or: [{ username }, { email: username }] }],
  });

  if (!user) return res.status(401).json({ error: "Invalid login" });

  res.json({
    status: "ok",
    username: user.username,
    email: user.email,
  });
});

// ============================================================================
//                         MOVIES / TV / ANIME / DETAILS
// ============================================================================

/* ✔ FIXED GENRES ENDPOINT */
app.get("/api/genres", async (req, res) => {
  try {
    let { type } = req.query;
    if (!type) return res.status(400).json({ error: "Type required" });

    // Normalize types
    if (type === "movies") type = "movie";
    if (type === "tv" || type === "tv_shows") type = "tv";
    if (type === "anime") type = "anime";

    const genres = await contentCollection.distinct("genre", { type });

    res.json(["All", ...genres.sort()]);
  } catch (err) {
    console.error("GENRES ERROR:", err);
    res.status(500).json({ error: "genres error" });
  }
});

// ----------------------------------------
// MOVIES
// ----------------------------------------
app.get("/api/movies", async (req, res) => {
  try {
    const { genre } = req.query;

    const filter = { type: "movie" };
    if (genre && genre !== "All") filter.$or = [{ genre }, { genres: genre }];

    const items = await contentCollection.find(filter).toArray();

    res.json(
      items.map((m) => ({
        id: m.mediaId || m._id,
        mediaId: m.mediaId || m._id,
        title: m.title,
        poster: m.posterUrl,
        genres: m.genres || [m.genre],
        description: m.overview || m.description,
        year: m.year,
        rating: m.rating,
      }))
    );
  } catch (err) {
    console.error("MOVIES ERROR:", err);
    res.status(500).json({ error: "movies error" });
  }
});

// ----------------------------------------
// TV
// ----------------------------------------
app.get("/api/tv", async (req, res) => {
  try {
    const { genre } = req.query;

    const filter = { type: "tv" };
    if (genre && genre !== "All") filter.$or = [{ genre }, { genres: genre }];

    const items = await contentCollection.find(filter).toArray();

    res.json(
      items.map((m) => ({
        id: m.mediaId || m._id,
        mediaId: m.mediaId || m._id,
        title: m.title,
        poster: m.posterUrl,
        genres: m.genres || [m.genre],
        description: m.overview || m.description,
        year: m.year,
        rating: m.rating,
      }))
    );
  } catch (err) {
    console.error("TV ERROR:", err);
    res.status(500).json({ error: "tv error" });
  }
});

// ----------------------------------------
// ANIME
// ----------------------------------------
app.get("/api/anime", async (req, res) => {
  try {
    const { genre } = req.query;

    const filter = { type: "anime" };
    if (genre && genre !== "All") filter.$or = [{ genre }, { genres: genre }];

    const items = await contentCollection.find(filter).toArray();

    res.json(
      items.map((m) => ({
        id: m.mediaId || m._id,
        mediaId: m.mediaId || m._id,
        title: m.title,
        poster: m.posterUrl,
        genres: m.genres || [m.genre],
        description: m.overview || m.description,
        year: m.year,
        rating: m.rating,
      }))
    );
  } catch (err) {
    console.error("ANIME ERROR:", err);
    res.status(500).json({ error: "anime error" });
  }
});

// ----------------------------------------
// CONTENT DETAILS (FIXED)
// ----------------------------------------
app.get("/api/details", async (req, res) => {
  try {
    const { id, category } = req.query;

    if (!id) return res.status(400).json({ error: "id required" });

    // Extract numeric TMDB ID
    let numericId = parseInt(id.split("_").find((x) => /^\d+$/.test(x)) || id);

    let doc = null;

    // Try ALL possible lookups
    const tryQueries = [
      { mediaId: id },
      { mediaId: String(id) },
      { mediaId: "tmdb_movie_" + numericId },
      { mediaId: "tmdb_tv_" + numericId },
      { mediaId: "tmdb_anime_" + numericId },
      { tmdbId: numericId },
      { tmdbId: String(numericId) },
    ];

    for (let q of tryQueries) {
      doc = await contentCollection.findOne(q);
      if (doc) break;
    }

    // Try ObjectId lookup safely
    try {
      doc = doc || (await contentCollection.findOne({ _id: new ObjectId(id) }));
    } catch {}

    if (!doc) {
      console.log("DETAILS NOT FOUND FOR ID:", id, "numeric:", numericId);
      return res.status(404).json({ error: "not found" });
    }

    // --------------------------------------------------------------------
    // ⭐ AI DESCRIPTION GENERATION USING OLLAMA (FREE / LOCAL)
    // --------------------------------------------------------------------

    let aiDescription = null;

    try {
      const prompt = `
Write a short English description (4-5 sentences) for this title:

Title: ${doc.title}
Genre: ${doc.genres?.join(", ")}
Year: ${doc.year}
Cast: ${doc.mainCast?.slice(0, 4).join(", ")}

Make it engaging and spoiler-free.
      `;

      const aiRes = await ollama.generate({
        model: "llama3.1", // or "mistral" if you prefer smaller model
        prompt: prompt,
      });

      aiDescription = aiRes.response.trim();
    } catch (err) {
      console.error("❌ AI Description Error:", err);
    }

    // --------------------------------------------------------------------
    // ⭐ FINAL RESPONSE
    // --------------------------------------------------------------------

    res.json({
      id: doc.mediaId || doc._id,
      mediaId: doc.mediaId || doc._id,
      title: doc.title,
      poster: doc.posterUrl,
      genres: doc.genres || [doc.genre],
      description:
        aiDescription ||
        doc.overview ||
        doc.description ||
        "No description available",
      year: doc.year || "N/A",
      rating: doc.rating || "N/A",
      cast: doc.mainCast || [],
    });
  } catch (err) {
    console.error("DETAILS ERROR:", err);
    res.status(500).json({ error: "details error" });
  }
});

// ============================================================================
//                           C++ AUTH / PROFILE
// ============================================================================
app.post("/cpp/login", async (req, res) => {
  const { username, password } = req.body;

  const hash = sha256hex(password);

  const user = await usersCollection.findOne({
    $and: [{ password: hash }, { $or: [{ username }, { email: username }] }],
  });

  if (!user) return res.status(401).json({ error: "invalid login" });

  res.json({
    status: "ok",
    username: user.username,
    email: user.email,
  });
});

app.post("/cpp/register", async (req, res) => {
  const { username, password, email } = req.body;

  const exists = await usersCollection.findOne({ username });
  if (exists) return res.status(409).json({ error: "username exists" });

  const hash = sha256hex(password);

  await usersCollection.insertOne({
    username,
    password: hash,
    email,
    fullname: username,
    createdAt: new Date(),

    stats: { completed: 0, favorites: 0, watchlist: 0 },
    achievements: [],
    watchlist: [],
    preferences: {
      emailNotifications: true,
      pushNotifications: false,
      autoPlayTrailers: true,
      darkMode: true,
    },
  });

  res.json({ status: "ok" });
});

app.get("/cpp/profile", async (req, res) => {
  const { username } = req.query;

  const user = await usersCollection.findOne({ username });
  if (!user) return res.status(404).json({ error: "not found" });

  res.json(user);
});

app.post("/cpp/profile/update", async (req, res) => {
  const { username, updates } = req.body;

  let setObj = {};

  if (updates.newUsername) {
    const exists = await usersCollection.findOne({
      username: updates.newUsername,
    });
    if (exists) return res.status(409).json({ error: "username exists" });
    setObj.username = updates.newUsername;
  }

  if (updates.email) setObj.email = updates.email;
  if (updates.newPassword) setObj.password = sha256hex(updates.newPassword);

  await usersCollection.updateOne({ username }, { $set: setObj });

  res.json({ success: true });
});

app.post("/cpp/profile/delete", async (req, res) => {
  const { username, password } = req.body;

  const user = await usersCollection.findOne({ username });
  if (!user) return res.status(404).json({ error: "not found" });

  if (sha256hex(password) !== user.password)
    return res.status(401).json({ deleted: false });

  await usersCollection.deleteOne({ username });

  res.json({ deleted: true });
});

// ============================================================================
//                              C++ QUIZ
// ============================================================================
app.get("/cpp/quiz", async (req, res) => {
  const { type, genre, limit } = req.query;
  const lim = parseInt(limit) || 5;

  const questions = await questionsCollection
    .aggregate([
      { $match: { category: type, genre } },
      { $sample: { size: lim } },
    ])
    .toArray();

  res.json(questions);
});

app.get("/cpp/quiz/byMedia", async (req, res) => {
  const { mediaId } = req.query;

  if (!mediaId) return res.status(400).json({ error: "mediaId required" });

  const questions = await questionsCollection.find({ mediaId }).toArray();

  res.json(questions);
});

app.post("/cpp/submit", async (req, res) => {
  const { username, answers } = req.body;

  let score = 0;
  for (let ans of answers) {
    const q = await questionsCollection.findOne({ _id: ans.questionId });
    if (q && ans.selectedIndex === q.correctOptionIndex) score++;
  }

  await resultsCollection.insertOne({
    username,
    score,
    total: answers.length,
    date: new Date(),
  });

  await leaderboardCollection.updateOne(
    { username },
    { $max: { score }, $set: { updatedAt: new Date() } },
    { upsert: true }
  );

  res.json({ score, total: answers.length });
});

// ============================================================================
//                           C++ LEADERBOARD
// ============================================================================
app.get("/cpp/leaderboard", async (req, res) => {
  const rows = await leaderboardCollection
    .find({})
    .sort({ score: -1 })
    .toArray();

  res.json(rows);
});

app.post("/cpp/leaderboard/update", async (req, res) => {
  const { username, score } = req.body;

  await leaderboardCollection.updateOne(
    { username },
    { $max: { score } },
    { upsert: true }
  );

  res.json({ success: true });
});

app.post("/cpp/leaderboard/remove", async (req, res) => {
  const { username } = req.body;

  await leaderboardCollection.deleteOne({ username });
  res.json({ success: true });
});

app.post("/cpp/leaderboard/rename", async (req, res) => {
  const { oldName, newName } = req.body;

  await leaderboardCollection.updateOne(
    { username: oldName },
    { $set: { username: newName } }
  );

  res.json({ success: true });
});

// ============================================================================
//                           WEB PROFILE MGMT
// ============================================================================
app.get("/api/user", async (req, res) => {
  const { username } = req.query;

  const user = await usersCollection.findOne({ username });
  if (!user) return res.status(404).json({ error: "user not found" });

  // ⭐ Auto-fix stats using actual array lengths
  const correctWatchlist = user.watchlist?.length || 0;
  const correctCompleted = user.watched?.length || 0;
  const correctFavorites = user.favorites?.length || 0;

  // ⭐ Update DB if values are wrong
  await usersCollection.updateOne(
    { username },
    {
      $set: {
        "stats.watchlist": correctWatchlist,
        "stats.completed": correctCompleted,
        "stats.favorites": correctFavorites
      }
    }
  );

  // ⭐ Also correct the values being returned
  user.stats.watchlist = correctWatchlist;
  user.stats.completed = correctCompleted;
  user.stats.favorites = correctFavorites;

  res.json(user);
});



app.post("/api/user/update", async (req, res) => {
  const { username, newUsername, fullname, email } = req.body;

  let setObj = {};
  if (newUsername) setObj.username = newUsername;
  if (fullname) setObj.fullname = fullname;
  if (email) setObj.email = email;

  await usersCollection.updateOne({ username }, { $set: setObj });

  res.json({ success: true });
});

app.post("/api/user/password", async (req, res) => {
  const { username, oldPassword, newPassword } = req.body;

  const user = await usersCollection.findOne({ username });
  if (!user) return res.json({ success: false });

  if (sha256hex(oldPassword) !== user.password)
    return res.json({ success: false });

  await usersCollection.updateOne(
    { username },
    { $set: { password: sha256hex(newPassword) } }
  );

  res.json({ success: true });
});

// ============================================================================
//                                WATCHLIST API
// ============================================================================

// Add to Watchlist
app.post("/api/watchlist/add", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    console.log("Auth Header received:", authHeader); // Debug log

    if (!authHeader) {
      return res.status(401).json({ success: false, message: "No token" });
    }

    // Remove 'Bearer ' prefix if present
    const username = authHeader.replace("Bearer ", "").trim();
    console.log("Username extracted:", username); // Debug log

    const { mediaId, title, poster, type } = req.body;
    console.log("Request body:", req.body); // Debug log

    if (!mediaId) {
      return res
        .status(400)
        .json({ success: false, message: "mediaId required" });
    }

    const user = await usersCollection.findOne({ username });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Check for duplicates
    const exists = user.watchlist?.find((item) => item.mediaId == mediaId);
    if (exists) {
      return res.json({ success: true, message: "Already in watchlist" });
    }

    await usersCollection.updateOne(
      { username },
      {
        $push: {
          watchlist: {
            mediaId,
            title,
            poster,
            type,
            addedAt: new Date(),
          },
        },
        $inc: { "stats.watchlist": 1 },
      }
    );

    res.json({ success: true, message: "Added to watchlist" });
  } catch (err) {
    console.error("WATCHLIST ADD ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get Watchlist
app.get("/api/watchlist/get", async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) return res.status(400).json({ error: "username required" });

    const user = await usersCollection.findOne({ username });
    if (!user) return res.status(404).json({ error: "user not found" });

    res.json({ items: user.watchlist || [] });
  } catch (err) {
    console.error("WATCHLIST GET ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Remove from watchlist (optional)
app.post("/api/watchlist/remove", async (req, res) => {
  try {
    const { username, mediaId } = req.body;
    if (!username || !mediaId) return res.status(400).json({ success: false });

    await usersCollection.updateOne(
      { username },
      {
        $pull: { watchlist: { mediaId } },
        $inc: { "stats.watchlist": -1 }, // ⭐ NEW: decrease counter
      }
    );

    res.json({ success: true });
  } catch (err) {
    console.error("WATCHLIST REMOVE ERROR:", err);
    res.status(500).json({ success: false });
  }
});

// ============================================================================
// MARK AS WATCHED (FIXED)
// ============================================================================
app.post("/api/user/mark-watched", async (req, res) => {
  try {
    const username = req.headers.authorization?.replace("Bearer ", "").trim();
    const { mediaId, title, poster, type } = req.body;

    if (!username) {
      return res.status(400).json({ error: "Missing username" });
    }

    if (!mediaId) {
      return res.status(400).json({ error: "Missing mediaId" });
    }

    await usersCollection.updateOne(
      { username },
      {
        $addToSet: {
          watched: {
            mediaId,
            title,
            poster,
            type,
            watchedAt: new Date(),
          },
        },
      }
    );

    return res.json({ success: true });
  } catch (err) {
    console.error("❌ Mark Watched Error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// ============================================================================
// START SERVER
// ============================================================================
app.listen(PORT, () =>
  console.log(`🚀 Server running at http://localhost:${PORT}`)
);
