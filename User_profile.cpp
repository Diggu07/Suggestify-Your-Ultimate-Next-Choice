#include<iostream>
#include<string>
#include<fstream>
#include<iomanip>
#include "User_profile.h"
#include "User_login.h"
#include "Leaderboard.h"
using namespace std;

Leaderboard lb("Leaderboard.json");

string currentDateTime() {
    time_t now = time(0);
    tm* ltm = localtime(&now);
    char buf[20];
    strftime(buf, sizeof(buf), "%Y-%m-%d %H:%M:%S", ltm);
    return string(buf);
}

void viewProfile(const string& filename, const string& username){
    ifstream user_get(filename);
    if(!user_get){
        cout<<"Error Opening File!!"<<endl;
        return;
    }
    bool found=false;
    string pass;
    json data;
    user_get>>data;
    user_get.close();
    for(auto& user: data["users"]){
        if(user["Username"]==username){
            cout<<"Enter Password:";
            getline(cin,pass);
            found=true;
            if(SHA_256(pass) == user["Password"]){
                cout<<"\n=== Profile Details ==="<<endl;
                cout<<"Username: "<<user["Username"]<<endl;
                cout<<"Email: "<<user["Email"]<<endl;
            }
            else{
                cout<<"!!Invalid Credentials!!"<<endl;
            }
            pass.clear();
            break;
        }
    }    
    if(!found){
        cout<<"User does not exists!!"<<endl;
    }
}

void editProfile(const string& filename,string& username){
    ifstream user_get(filename);
    if(!user_get){
        cout<<"Error Opening File!!"<<endl;
        return;
    }
    bool found=false;
    string pass;
    json data;
    user_get>>data;
    user_get.close();
    for(auto& user:data["users"]){
        if(user["Username"]==username){
            cout<<"Enter Password:";
            getline(cin,pass);
            found=true;
            if(SHA_256(pass) == user["Password"]){
                int choice;
                cout<<"What do you want to change:\n1.Username\n2.Email\n";
                cin>>choice;
                cin.ignore();
                if(choice == 1){
                    string new_username;
                    cout << "Enter Updated Username: ";
                    getline(cin, new_username);
                    user["Username"] = new_username;
                    lb.load(true);
                    lb.updateUsername(username, new_username);
                    username = new_username;
                } else if(choice == 2){
                    string email;
                    cout << "Enter Updated Email: ";
                    getline(cin, email);
                    user["Email"] = email;
                } else {
                    cout << "Invalid choice!" << endl;
                }
                ofstream user_put(filename);
                if(!user_put){
                    cout<<"Error saving changes!"<<endl;
                    return;
                }
                user_put<<setw(4)<<data;
                user_put.close();
                cout<<"Profile updated successfully!"<<endl;
            }
            else{
                cout<<"!!Invalid Password!!"<<endl;
            }
            pass.clear();
            break;
        }
    }
    if(!found)
        cout<<"User Does Not Exist!!"<<endl;
    
}

void update_password(const string& filename,const string& username){
    ifstream user_get(filename);
    if(!user_get){
        cout<<"Error Opening File!!"<<endl;
        return;
    }

    bool found=false;
    string pass;
    json data;
    user_get>>data;
    user_get.close();
    for(auto& user:data["users"]){
        if(user["Username"]==username){
            cout<<"Enter Password:";
            getline(cin,pass);
            found=true;
            if(SHA_256(pass) == user["Password"]){
                string new_password;
                cout<<"Enter Updated Password:";
                getline(cin,new_password);
                user["Password"]=SHA_256(new_password);
                ofstream user_put(filename);
                if(!user_put){
                    cout<<"Error saving changes!"<<endl;
                    return;
                }
                user_put<<setw(4)<<data;
                user_put.close();
                cout<<"Password updated successfully!"<<endl;
                new_password.clear();
            }
            else{
                cout<<"!!Invalid Credentials!!"<<endl;
            }
            pass.clear();
            break;
        }
    }
    if(!found){
        cout<<"User does not exist!!"<<endl;
    }
}

void delete_account(const string& filename,const string& username){
    ifstream user_get(filename);
    if(!user_get){
        cout<<"Error Opening File!!"<<endl;
        return;
    }
    bool deleted=false;
    string pass;
    json data;
    user_get>>data;
    user_get.close();
    for(auto itr=data["users"].begin();itr!=data["users"].end();++itr){
        if((*itr)["Username"]==username){
            cout<<"Enter Password:";
            getline(cin,pass);
            pass.erase(pass.find_last_not_of(" \n\r\t")+1);
            if(SHA_256(pass) == (*itr)["Password"]){
                data["users"].erase(itr);
                deleted=true;
                break;
            }
            else{
                cout<<"Invalid Password!!"<<endl;
            }
        }
    }

    if(deleted){
        ofstream user_put(filename);
        user_put << setw(4) << data;
        user_put.close();

        json deletedData;
        ifstream deleted_in("Deleted_Users.json");
        if (deleted_in) {
            deleted_in >> deletedData;
            deleted_in.close();
    } else {
            deletedData = {{"deleted", json::array()}};
        }
        deletedData["deleted"].push_back({
            {"Username", username},
            {"Password", SHA_256(pass)},
            {"DeletedAt", currentDateTime()}
        });
        ofstream deleted_out("Deleted_Users.json");
        deleted_out << setw(4) << deletedData;
        deleted_out.close();
    } else {
        cout << "User does not exist!!" << endl;
    }
}