#include "User_login.h"
#include "http_client.h"
#include "json.hpp"
#include <iostream>
#include <string>
#include "sha256.h"

using json = nlohmann::json;
using namespace std;

int exists(const string& username, const string& pass) {
    try {
        HttpClient cli("localhost", 5000, false);

        json payload = {
            {"username", username},
            {"password", pass}
        };

        HttpResponse res = cli.Post("/cpp/login", payload.dump(), "application/json");

        return (res.status == 200);
    }
    catch (...) {
        cout << "Login error\n";
        return 0;
    }
}

void login(const string& username, const string& pass) {
    if (exists(username, pass))
        cout << "SUCCESS\n";
    else
        cout << "FAILED\n";
}

void registerUser(const string& username, const string& pass) {
    try {
        HttpClient cli("localhost", 5000, false);

        json payload = {
            {"username", username},
            {"password", pass},
            {"email", username}
        };

        HttpResponse res = cli.Post("/cpp/register", payload.dump(), "application/json");

        if (res.status == 200)
            cout << "REGISTERED\n";
        else
            cout << "FAILED\n";
    }
    catch (...) {
        cout << "Error during registration\n";
    }
}
