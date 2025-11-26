#ifndef QUIZ_H
#define QUIZ_H

#include <string>
#include <vector>

struct Question {
    std::string question;
    std::string optionA;
    std::string optionB;
    std::string optionC;
    std::string optionD;
    char correctOption;
};

class Quiz {
private:
    std::vector<Question> questions;
    int score;

public:
    Quiz();

    // Load questions from Node.js backend (/cpp/quiz)
    // You can optionally pass type, genre, and limit.
    void loadQuestionsFromAPI(const std::string& type = "",
                              const std::string& genre = "",
                              int limit = 0);

    // Backward compatibility: load from DB (calls API internally)
    void loadQuestionsFromDB();

    // Get a random question from loaded list
    Question getRandomQuestion();

    // Run interactive quiz (console)
    void startQuiz(const std::string &username);

    // Save result locally (text file)
    void saveResult(const std::string &username);

    // Submit score to backend (/cpp/submit)
    void submitScore(const std::string &username);
};

#endif // QUIZ_H
