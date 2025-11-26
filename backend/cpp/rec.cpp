#include <iostream>
#include "recommendation.h"
using namespace std;

int main() {
    recommendation r;

    cout << "=== Multi-Type Recommendation Engine Test ===\n\n";

    // Step 1️⃣ — Load existing JSON data if available
    cout << "Loading existing data...\n";
    r.loadfromJSON();
    cout << "Data loaded successfully (or initialized new if none found).\n\n";

    // Step 2️⃣ — Add some users with liked genres
    cout << "Adding sample users...\n";
    r.addUser("Diggu", {"Action", "Fantasy", "Science"});
    r.addUser("Rehan", {"Comedy", "Mystery"});
    r.addUser("Ayush", {"Horror", "Adventure"});
    r.addUser("Shreyansh", {"Romance", "Fantasy"});

    // Step 3️⃣ — Add multiple media types and their items using public methods
    cout << "\nAdding multi-media content...\n";

    // 🎬 Movies
    r.addMediaGenre("Movies", "Action", {"Inception", "Mad Max: Fury Road", "John Wick"});
    r.addMediaGenre("Movies", "Fantasy", {"Harry Potter", "The Lord of the Rings", "Avatar"});
    r.addMediaGenre("Movies", "Comedy", {"The Office", "Superbad", "The Hangover"});

    // 📚 Books
    r.addMediaGenre("Books", "Fantasy", {"Eragon", "Mistborn", "The Hobbit"});
    r.addMediaGenre("Books", "Mystery", {"Sherlock Holmes", "Gone Girl", "The Girl with the Dragon Tattoo"});
    r.addMediaGenre("Books", "Romance", {"Pride and Prejudice", "Me Before You"});

    // 🎧 Podcasts
    r.addMediaGenre("Podcasts", "Science", {"Science Vs", "Lex Fridman Podcast", "The Infinite Monkey Cage"});
    r.addMediaGenre("Podcasts", "Comedy", {"Conan O'Brien Needs a Friend", "The Daily Show Podcast"});

    // 🎮 Games
    r.addMediaGenre("Games", "Adventure", {"Uncharted 4", "Zelda", "Assassin's Creed Odyssey"});
    r.addMediaGenre("Games", "Action", {"God of War", "Devil May Cry 5"});
    r.addMediaGenre("Games", "Fantasy", {"Elden Ring", "The Witcher 3"});

    // 📺 TV Shows
    r.addMediaGenre("TVShows", "Action", {"Breaking Bad", "The Boys", "24"});
    r.addMediaGenre("TVShows", "Fantasy", {"Game of Thrones", "The Witcher"});
    r.addMediaGenre("TVShows", "Mystery", {"Sherlock", "Dark"});

    // Step 4️⃣ — Save all to JSON
    cout << "\nSaving all data to recommend.json...\n";
    r.savetoJSON();

    // Step 5️⃣ — Display Recommendations by Media Type
    cout << "\n\n=== Generating Recommendations ===\n";
    r.displayRecommendations("Diggu", "Movies");
    r.displayRecommendations("Diggu", "Books");
    r.displayRecommendations("Diggu", "Podcasts");

    r.displayRecommendations("Rehan", "Movies");
    r.displayRecommendations("Ayush", "Games");

    cout << "=== Test Completed Successfully ===\n";
    return 0;
}
