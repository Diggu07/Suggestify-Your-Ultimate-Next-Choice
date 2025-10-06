#include <iostream>
#include "User_login.h"  // Assumes your login functions are declared here

using namespace std;

int main() {
    string username, password;

    cout << "Welcome! Please enter your username: ";
    getline(cin, username);

    cout << "Please enter your password: ";
    getline(cin, password);

    // Call login function which handles authentication and registration if needed
    login(username, password);

    return 0;
}
