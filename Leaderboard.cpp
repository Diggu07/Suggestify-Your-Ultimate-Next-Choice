#include<iostream>
#include<fstream>
#include<string>
#include<algorithm>
#include "Leaderboard.h"
#include "json.hpp"
using json=nlohmann::json;


Leaderboard::Leaderboard(const string& file):filename(file){
    load(true);
}

void Leaderboard::load(bool silent){
    ifstream getboard(filename);
    if(!getboard){
        cout<<"ERROR OPENING FILE!!"<<endl;
        return;
    }
    try{  
        json data;
        getboard>>data;
        entries.clear();
        for(auto& user: data){
            entries.push_back({user["Username"],user["Score"]});
        }
        getboard.close();
        sortDescending();
        if(!silent)
            cout<<"Leaderboard Loaded Successfully!!"<<endl;
    }
    catch (const nlohmann::json::parse_error& e) {
        cerr << "JSON parse error: " << e.what() << endl;
    }
    catch (const std::out_of_range& e) {
        cerr << "JSON key error: " << e.what() << endl;
    }
    catch (const nlohmann::json::type_error& e) {
        cerr << "JSON type error: " << e.what() << endl;
    }
    catch (const std::exception& e) {
        cerr << "Error: " << e.what() << endl;
    }
    catch (...) {
        cerr << "Unknown error occurred." << endl;
    }
}

void Leaderboard::updateUsername(const std::string& oldName, const std::string& newName){
    for (auto& entry : entries) {
        if (entry.name == oldName) {
            entry.name = newName;
        }
    }
    save();
}

void Leaderboard::save(){
    try
    {
        ofstream saveboard(filename);
        if(!saveboard){
            cout<<"!!ERROR OPENING FILE!!"<<endl;
            return;
        }
        json data=json::array();
        for(auto& entry:entries){
            data.push_back({{"Username",entry.name},{"Score",entry.score}});
        }
        saveboard<<data.dump(4);
        saveboard.close();
    }
    catch(const nlohmann::json::parse_error& e){
        cerr<<"JSON Parse Error: "<<e.what()<<endl;
    }
    catch(const nlohmann::json::type_error& e){
        cerr<<"JSON Type Error: "<<e.what()<<endl;
    }
    catch(const std::out_of_range& e){
        cerr<<"JSON Key Error"<<e.what()<<endl;
    }
    catch(const std::exception& e){
        cerr<<"Error: "<<e.what()<<endl;
    }
    catch(...){
        cerr<<"Unknown Error Occurred!"<<endl;
    }
    
}

void Leaderboard::update(const string& uname,int score){
    bool found=false;
    for(auto& entry: entries){
        if(entry.name==uname){
            found=true;
            entry.score=max(entry.score,score);
            break;
        }
    }
    if (!found) {
        entries.push_back({uname, score});
    }
    sortDescending();
    save();
}

void Leaderboard::sortDescending(){
    if(isEmpty()){
        return;
    }
    sort(entries.begin(),entries.end(),
            [](const Entry&e1,const Entry& e2){
                return e1.score>e2.score;
            });
}

void Leaderboard::display(){
    if(isEmpty()){
        return;
    }
    int i=1;
    cout<<left<<setw(10)<<"RANK"
        <<setw(30)<<"NAME"
        <<setw(15)<<"SCORE"<<endl;
    cout<<string(55,'-')<<endl;
    for(auto entry:entries){
        cout<<setw(10)<<i++
            <<setw(30)<<entry.name
            <<setw(15)<<entry.score<<endl;
    }
}

void Leaderboard::showTop10(){
    if(isEmpty()){
        return;
    }
    int limit=min(10,(int)(entries.size()));
    cout<<left<<setw(10)<<"RANK"
        <<setw(30)<<"NAME"
        <<setw(15)<<"SCORE"<<endl;
    cout<<string(55,'-')<<endl;

    for(int i=0;i<limit;i++){
        cout<<setw(10)<<i+1
            <<setw(30)<<entries[i].name
            <<setw(15)<<entries[i].score<<endl;
    }
}

bool Leaderboard::isEmpty(){
    if(entries.empty()){
        cout<<"!!Leaderboard is Empty!!"<<endl;
        return true;
    }
    return false;
}

bool Leaderboard::checkUser(const string& uname){
    if(isEmpty()){
        return false;
    }
    for(auto entry:entries){
        if(entry.name==uname)
            return true;
    }
    return false;
}

void Leaderboard::getUserScore(const string& uname){
    if(!checkUser(uname)){
        cout<<"User does not exist!!"<<endl;
        return;
    }
    for(auto entry:entries){
        if(entry.name==uname){
            cout<<"Username:"<<uname<<setw(10)
                <<endl<<"Score:"<<entry.score<<endl;
            break;
        }
    }
}

void Leaderboard::getUserRank(const string& uname){
    if(!checkUser(uname)){
        cout<<"User does not exist!!"<<endl;
        return;
    }
    for(size_t i=0;i<entries.size();i++){
        if(entries[i].name==uname){
            cout<<setw(10)<<i+1
                <<setw(30)<<entries[i].name
                <<setw(15)<<entries[i].score<<endl;
            break;
        }
    }
}

void Leaderboard::removeUser(const string& uname){
    entries.erase(
        remove_if(entries.begin(),entries.end(),
            [&](Entry &entry){
                return entry.name==uname;
            }),entries.end());

    save();
}