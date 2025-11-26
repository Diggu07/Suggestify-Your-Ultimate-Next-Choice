#include "quiz.h"
#include <iostream>
#include <fstream>
#include <ctime>
#include <cstdlib>

#include "http_client.h"
#include "json.hpp"

using json = nlohmann::json;
using namespace std;

Quiz::Quiz() : score(0) {
    srand((unsigned)time(NULL));
}

void Quiz::loadQuestionsFromAPI(const string &type, const string &genre, int limit) {
    try {
        HttpClient cli("localhost", 5000, false);

        string path = "/cpp/quiz?type=" + type + "&genre=" + genre + "&limit=" + to_string(limit);

        HttpResponse res = cli.Get(path);
        if (res.status != 200) {
            cout << "❌ Could not load quiz questions. HTTP " << res.status << "\n";
            return;
        }

        json data = json::parse(res.body);
        questions.clear();

        for (auto &qjson : data) {
            Question q;
            q.question = qjson.value("question", "");
            q.optionA  = qjson.value("A", "");
            q.optionB  = qjson.value("B", "");
            q.optionC  = qjson.value("C", "");
            q.optionD  = qjson.value("D", "");
            q.correctOption = toupper(qjson.value("correct", "A")[0]);
            questions.push_back(q);
        }

        cout << "✔ Loaded " << questions.size() << " questions.\n";

    } catch (...) {
        cout << "❌ Quiz load error.\n";
    }
}

void Quiz::startQuiz(const string &username) {
    if (questions.empty()) {
        cout << "❌ No questions loaded!\n";
        return;
    }

    score = 0;
    char choice;

    cout << "\n===== QUIZ =====\n";

    for (int i = 0; i < 5 && i < (int)questions.size(); i++) {
        Question q = getRandomQuestion();

        cout << "\nQ" << i + 1 << ": " << q.question << "\n";
        cout << "A. " << q.optionA << "\n";
        cout << "B. " << q.optionB << "\n";
        cout << "C. " << q.optionC << "\n";
        cout << "D. " << q.optionD << "\n";
        cout << "Your Answer: ";
        cin >> choice;
        choice = toupper(choice);

        if (choice == q.correctOption) {
            cout << "✔ Correct!\n";
            score++;
        } else {
            cout << "✘ Wrong! Correct answer: " << q.correctOption << "\n";
        }
    }

    cout << "\nYour Score: " << score << "/5\n";

    submitScore(username);
}

void Quiz::submitScore(const string &username) {
    try {
        HttpClient cli("localhost", 5000, false);

        json payload = { {"username", username}, {"score", score} };

        HttpResponse res =
            cli.Post("/cpp/submit", payload.dump(), "application/json");

        if (res.status == 200)
            cout << "✔ Score saved to MongoDB.\n";
        else
            cout << "⚠ Warning: Could not save score. HTTP " << res.status << "\n";

    } catch (...) {
        cout << "❌ Exception during score submit.\n";
    }
}
