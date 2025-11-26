#include "User_profile.h"
#include "http_client.h"
#include "json.hpp"
#include <iostream>
#include <string>

using json = nlohmann::json;
using namespace std;

void viewProfile(const string& username) {
    HttpClient cli("localhost", 5000, false);
    HttpResponse res = cli.Get("/cpp/profile?username=" + username);

    if (res.status != 200) {
        cout << "Profile fetch failed.\n";
        return;
    }

    json d = json::parse(res.body);

    cout << "\n===== PROFILE =====\n";
    cout << "Username: " << d["username"] << "\n";
    cout << "Full Name: " << d["fullname"] << "\n";
    cout << "Email: " << d["email"] << "\n";
    cout << "Joined: " << d["createdAt"] << "\n";
    cout << "===================\n";
}

void editProfile(string& username) {
    cout << "1. Change Username\n2. Change Email\nChoice: ";
    int ch;
    cin >> ch;

    json updates;

    if (ch == 1) {
        string newU;
        cout << "New username: ";
        cin >> newU;
        updates["newUsername"] = newU;
    }
    else if (ch == 2) {
        string newE;
        cout << "New email: ";
        cin >> newE;
        updates["email"] = newE;
    }

    HttpClient cli("localhost", 5000, false);

    json req = {
        {"username", username},
        {"updates", updates}
    };

    HttpResponse res = cli.Post("/cpp/profile/update", req.dump(), "application/json");

    if (res.status == 200) {
        cout << "Updated.\n";
        if (updates.contains("newUsername"))
            username = updates["newUsername"];
    } else {
        cout << "Update failed.\n";
    }
}

void update_password(const string& username) {
    string oldP, newP;

    cout << "Old password: ";
    cin >> oldP;

    cout << "New password: ";
    cin >> newP;

    HttpClient cli("localhost", 5000, false);

    json req = {
        {"username", username},
        {"updates", { {"newPassword", newP} }}
    };

    HttpResponse res = cli.Post("/cpp/profile/update", req.dump(), "application/json");

    if (res.status == 200)
        cout << "Password updated.\n";
    else
        cout << "Error updating password.\n";
}

void delete_account(const string& username) {
    string p;
    cout << "Enter password: ";
    cin >> p;

    HttpClient cli("localhost", 5000, false);

    json req = {
        {"username", username},
        {"password", p}
    };

    HttpResponse res = cli.Post("/cpp/profile/delete", req.dump(), "application/json");

    if (res.status == 200)
        cout << "Account deleted.\n";
    else
        cout << "Deletion failed.\n";
}
