#include <iostream>
#include "User_login.h"
#include "User_profile.h"
#include "Leaderboard.h"

void showUserMenu() {
    cout<< "\nUser Menu:\n";
    cout<< "1. View Profile\n";
    cout<< "2. Edit Profile\n";
    cout<< "3. Update Password\n";
    cout<< "4. Delete Account\n";
    cout<< "5. Display Leaderboard\n";
    cout<< "6. Show Top 10\n";
    cout<< "7. Get My Score\n";
    cout<< "8. Get My Rank\n";
    cout<< "9. Update Score\n";
    cout<< "0. Logout\n";
    cout<< "Choose an option: ";
}

int main() {
    cout<< "=== Suggestify System Login ===\n";
    string username, password;
    int score = 0;
    
    cout << "1. Login\n2. Register\nChoose an option: ";
    int choice;
    cin >> choice;
    cin.ignore();

    if (choice == 1) {
        cout << "Enter username: ";
        getline(cin, username);
        cout << "Enter password: ";
        getline(cin, password);
        if (exists(username, password) != 1) {
            cout << "User not found. Do you want to register? (y/n): ";
            char regChoice;
            cin >> regChoice;
            cin.ignore();
            
            if (regChoice == 'y' || regChoice == 'Y') {
                cout << "Redirecting to registration...\n";
                registerUser(username, password);
                cout << "Registration successful!\n";
            } else {
                cout << "Please try logging in again.\n";
            }
        } else {
            cout << "Login successful!\n";
        }
    } else if (choice == 2) {
        cout << "Proceeding to registration...\n";
        cout << "Enter username: ";
        getline(cin, username);
        cout << "Enter password: ";
        getline(cin, password);
        registerUser(username, password);
        cout << "Registration successful!\n";

    } else {
        cout << "Invalid choice.\n";
    }
    
    cout<< "Enter your initial score: ";
    cin >> score;
    cin.ignore();
    
    Leaderboard leaderboard("Leaderboard.json");
    leaderboard.update(username, score);

    bool loggedIn = true;
    while (loggedIn) {
        showUserMenu();
        int choice;
        cin >> choice;
        cin.ignore();

        switch (choice) {
            case 1:
                viewProfile("Users.json", username);
                break;
            case 2:
                editProfile("Users.json", username);
                break;
            case 3:
                update_password("Users.json", username);
                break;
            case 4:
                delete_account("Users.json", username);
                loggedIn = false;
                break;
            case 5:
                leaderboard.display();
                break;
            case 6:
                leaderboard.showTop10();
                break;
            case 7:
                leaderboard.getUserScore(username);
                break;
            case 8:
                leaderboard.getUserRank(username);
                break;
            case 9: {
                int newScore;
                cout<< "Enter new score: ";
                cin >> newScore;
                cin.ignore();
                leaderboard.update(username, newScore);
                break;
            }
            case 0:
                loggedIn = false;
                break;
            default:
                cout<< "Invalid option. Try again.\n";
                break;
        }
    }

    leaderboard.save();
    cout<< "Logged out. Goodbye!\n";
    return 0;
}
