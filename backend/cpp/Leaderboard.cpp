#include "Leaderboard.h"
#include <algorithm>

#include "http_client.h"
#include "json.hpp"

using json = nlohmann::json;
using namespace std;

Leaderboard::Leaderboard(const string& file) {
    filename = file;
}

void Leaderboard::load(bool silent) {
    HttpClient cli("localhost", 5000, false);
    HttpResponse res = cli.Get("/cpp/leaderboard");

    if (res.status != 200) {
        if (!silent) cout << "❌ Failed to load leaderboard from MongoDB.\n";
        return;
    }

    try {
        json data = json::parse(res.body);
        entries.clear();

        for (auto &e : data) {
            Entry en;
            en.name = e.value("username", "");
            en.score = e.value("score", 0);
            entries.push_back(en);
        }

        sortDescending();

        if (!silent)
            cout << "✔ Leaderboard loaded from MongoDB.\n";

    } catch (...) {
        cout << "❌ Error: Could not parse leaderboard JSON.\n";
    }
}

void Leaderboard::update(const string& uname, int score) {
    bool found = false;

    for (auto &e : entries) {
        if (e.name == uname) {
            e.score = max(e.score, score);
            found = true;
        }
    }

    if (!found)
        entries.push_back({uname, score});

    sortDescending();

    HttpClient cli("localhost", 5000, false);
    json payload = { {"username", uname}, {"score", score} };

    HttpResponse res =
        cli.Post("/cpp/leaderboard/update", payload.dump(), "application/json");

    if (res.status != 200)
        cout << "⚠ Warning: MongoDB leaderboard update failed.\n";
}

void Leaderboard::updateUsername(const string& oldName, const string& newName) {
    for (auto &e : entries)
        if (e.name == oldName)
            e.name = newName;

    sortDescending();

    HttpClient cli("localhost", 5000, false);
    json payload = { {"oldName", oldName}, {"newName", newName} };

    HttpResponse res =
        cli.Post("/cpp/leaderboard/rename", payload.dump(), "application/json");

    if (res.status != 200)
        cout << "⚠ Warning: Could not rename leaderboard entry in MongoDB.\n";
}

void Leaderboard::removeUser(const string& uname) {
    entries.erase(
        remove_if(entries.begin(), entries.end(),
                  [&](const Entry &e) { return e.name == uname; }),
        entries.end()
    );

    HttpClient cli("localhost", 5000, false);
    json payload = { {"username", uname} };

    HttpResponse res =
        cli.Post("/cpp/leaderboard/remove", payload.dump(), "application/json");

    if (res.status != 200)
        cout << "⚠ Warning: Could not remove user from MongoDB leaderboard.\n";
}

void Leaderboard::sortDescending() {
    sort(entries.begin(), entries.end(),
         [](const Entry& a, const Entry& b) {
             return a.score > b.score;
         });
}
