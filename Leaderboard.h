#ifndef LEADERBOARD_H
#define LEADERBOARD_H
#include <iostream>
#include <vector>
using namespace std;

typedef struct Entry{
    string name;
    int score;
}Entry;

class Leaderboard{
        vector<Entry> entries;
        string filename;
    public:
        Leaderboard(const string& file){}
        void load();
        void save();
        void update(const string& uname,int score);
        void sortDescending();
        void display();
        void showTop10();
        bool isEmpty();
        bool checkUser(const string& uname);
        void getUserScore(const string& uname);
        void getUserRank(const string& uname);
        void removeUser(const string& uname);
};
#endif