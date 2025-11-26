#include "recommendation.h"
#include <fstream>
#include <iostream>
#include <random>

#include "http_client.h"
#include "json.hpp"

using json = nlohmann::json;
using namespace std;

/* ---------- backup JSON methods ---------- */
void recommendation::savetoJSON() {
    json data;
    for (auto& [user, genres] : userLikes) {
        data["UserLikes"][user] = json::array();
        for (auto& g : genres) data["UserLikes"][user].push_back(g);
    }

    ofstream file("recommend.json");
    if (!file.is_open()) {
        cout << "❌ ERROR OPENING FILE FOR WRITE!!\n";
        return;
    }
    file << data.dump(4);
    file.close();
}

void recommendation::loadfromJSON() {
    ifstream file("recommend.json");
    if (!file.is_open()) {
        cout << "⚠️ No existing JSON found. New file will be created.\n";
        return;
    }
    json data;
    file >> data;
    file.close();
    userLikes.clear();
    if (data.contains("UserLikes")) {
        for (auto& [user, genres] : data["UserLikes"].items()) {
            for (auto& g : genres)
                userLikes[user].insert(g.get<string>());
        }
    }
    cout << "✅ JSON Loaded Successfully!\n";
}

/* ---------- User management ---------- */
void recommendation::addUser(const string& username, const unordered_set<string>& genres) {
    if (userLikes.find(username) != userLikes.end()) {
        cout << "⚠️ User already exists!\n";
        return;
    }
    userLikes[username] = genres;
    savetoJSON();
    cout << "✅ Added user '" << username << "'\n\n";
}

void recommendation::addUserGenre(const string& username, const string& genre) {
    if (!userExists(username)) {
        cout << "❌ User does not exist!\n";
        return;
    }
    userLikes[username].insert(genre);
    savetoJSON();
}

void recommendation::removeUser(const string& username) {
    if (!userExists(username)) {
        cout << "❌ User does not exist!\n";
        return;
    }
    userLikes.erase(username);
    savetoJSON();
}

void recommendation::removeUserGenre(const string& username, const string& genre) {
    if (!userExists(username)) {
        cout << "❌ User does not exist!\n";
        return;
    }
    userLikes[username].erase(genre);
    savetoJSON();
}

bool recommendation::userExists(const string& username) {
    return userLikes.find(username) != userLikes.end();
}

void recommendation::getUserGenre(const string& username) {
    if (!userExists(username)) {
        cout << "❌ User does not exist!\n";
        return;
    }
    cout << "User: " << username << "\nGenres: ";
    for (auto& g : userLikes[username]) cout << g << " ";
    cout << "\n\n";
}

/* ---------- Fetch items from Node backend (MongoDB) ---------- */
vector<string> recommendation::fetchItemsFromAPI(const string& mediaType, const string& genre) {
    vector<string> items;
    try {
        HttpClient cli("localhost", 5000, false);

        string path = "/cpp/media?mediaType=" + mediaType + "&genre=" + genre;

        HttpResponse res = cli.Get(path);
        if (res.status != 200) {
            cout << "❌ Backend fetch failed for " << mediaType << " / " << genre << "\n";
            return items;
        }

        json data = json::parse(res.body);

        for (auto &it : data) {
            if (it.is_object() && it.contains("title"))
                items.push_back(it["title"].get<string>());
            else if (it.is_string())
                items.push_back(it.get<string>());
        }
    } catch (...) {
        cout << "Exception during fetchItemsFromAPI\n";
    }
    return items;
}

/* ---------- Recommendation engine ---------- */
vector<string> recommendation::recommend(const string& username, const string& mediaType) {
    vector<string> recs;
    unordered_set<string> seen;

    // 1. If user does NOT exist locally → fetch preferences from backend
    if (!userExists(username)) {
        try {
            HttpClient cli("localhost", 5000, false);
            string path = "/cpp/prefs?username=" + username;

            HttpResponse res = cli.Get(path);
            if (res.status == 200) {
                json d = json::parse(res.body);

                for (auto &g : d) {
                    string genre = g.get<string>();
                    auto items = fetchItemsFromAPI(mediaType, genre);

                    for (auto &it : items) {
                        if (!seen.count(it)) {
                            recs.push_back(it);
                            seen.insert(it);
                        }
                    }
                }
            } else {
                cout << "❌ No local prefs and backend prefs not found.\n";
                return recs;
            }
        } catch (...) {
            cout << "Error fetching backend prefs.\n";
            return recs;
        }

        // Shuffle results
        random_device rd; 
        mt19937 gen(rd());
        shuffle(recs.begin(), recs.end(), gen);
        return recs;
    }

    // 2. If user exists locally → use local genres
    for (const auto& genre : userLikes[username]) {
        auto items = fetchItemsFromAPI(mediaType, genre);

        for (const auto& item : items) {
            if (!seen.count(item)) {
                recs.push_back(item);
                seen.insert(item);
            }
        }
    }

    random_device rd; 
    mt19937 gen(rd());
    shuffle(recs.begin(), recs.end(), gen);

    return recs;
}

/* ---------- display ---------- */
void recommendation::displayRecommendations(const string& username, const string& mediaType) {
    vector<string> recs = recommend(username, mediaType);

    cout << "\n==============================\n";
    cout << "Recommendations for " << username << " (" << mediaType << "):\n";
    cout << "==============================\n";

    if (recs.empty()) {
        cout << "No recommendations found.\n==============================\n\n";
        return;
    }

    int count = 1;
    for (auto& item : recs) cout << count++ << ". " << item << endl;

    cout << "==============================\n\n";
}
