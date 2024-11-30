#include <iostream>
#include <string>
#include <sstream>
#include <vector>
#include <stack>
#include <cctype>
#include <stdexcept>
#include <cstring>  // Для обработки аргументов командной строки

using namespace std;

double evaluateExpression(const string& expression);
double applyOperation(double a, double b, char op);
int precedence(char op);

int main(int argc, char* argv[]) {
    if (argc < 2) {
        cerr << "Error: No expression provided." << endl;
        return 1;
    }

    // Получаем выражение из первого аргумента командной строки
    string expression = argv[1];

    if (expression[0] == '=') {
        expression = expression.substr(1); // Убираем знак '='
    }

    try {
        // Вычисляем результат выражения
        double result = evaluateExpression(expression);
        // Выводим только результат
        cout.precision(15);  // Устанавливаем точность вывода
        cout << result << endl;  // Выводим результат в stdout

    } catch (const exception& e) {
        cerr << "Error: " << e.what() << endl;
    }

    return 0;
}

// Функция для вычисления выражений
double evaluateExpression(const string& expression) {
    stack<double> values;
    stack<char> ops;

    for (size_t i = 0; i < expression.length(); ++i) {
        if (isspace(expression[i])) continue;

        // Если это число
        if (isdigit(expression[i])) {
            double value = 0;
            while (i < expression.length() && (isdigit(expression[i]) || expression[i] == '.')) {
                if (expression[i] == '.') {
                    double decimalPlace = 0.1;
                    ++i;
                    while (i < expression.length() && isdigit(expression[i])) {
                        value += (expression[i] - '0') * decimalPlace;
                        decimalPlace *= 0.1;
                        ++i;
                    }
                    break;
                }
                value = value * 10 + (expression[i] - '0');
                ++i;
            }
            values.push(value);
            --i; // Корректируем индекс
        }
        // Если скобка '('
        else if (expression[i] == '(') {
            ops.push(expression[i]);
        }
        // Если скобка ')'
        else if (expression[i] == ')') {
            while (!ops.empty() && ops.top() != '(') {
                double right = values.top(); values.pop();
                double left = values.top(); values.pop();
                char op = ops.top(); ops.pop();
                values.push(applyOperation(left, right, op));
            }
            ops.pop(); // Убираем '('
        }
        // Если это операция
        else if (strchr("+-*/", expression[i])) {
            while (!ops.empty() && precedence(ops.top()) >= precedence(expression[i])) {
                double right = values.top(); values.pop();
                double left = values.top(); values.pop();
                char op = ops.top(); ops.pop();
                values.push(applyOperation(left, right, op));
            }
            ops.push(expression[i]);
        }
    }

    while (!ops.empty()) {
        double right = values.top(); values.pop();
        double left = values.top(); values.pop();
        char op = ops.top(); ops.pop();
        values.push(applyOperation(left, right, op));
    }

    return values.top(); // Результат
}

// Применяем операцию между двумя числами
double applyOperation(double a, double b, char op) {
    switch (op) {
        case '+': return a + b;
        case '-': return a - b;
        case '*': return a * b;
        case '/':
            if (b == 0) throw runtime_error("Division by zero");
            return a / b;
    }
    throw runtime_error("Unknown operation or extra parenthesis");
}

// Устанавливаем приоритет операций
int precedence(char op) {
    if (op == '+' || op == '-') return 1;
    if (op == '*' || op == '/') return 2;
    return 0;
}
