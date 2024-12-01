#include <iostream>
#include <string>
#include <sstream>
#include <vector>
#include <stack>
#include <cctype>
#include <stdexcept>
#include <cstring>

using namespace std;
string functionsAverage(const string& expression);
string functionsSum(const string& expression);
double evaluateExpression(const string& expression);
double applyOperation(double a, double b, char op);
int precedence(char op);
string removeDoublePlus(const string& input);


int main(int argc, char* argv[]) {
    if (argc < 2) {
        cerr << "Error: No expression provided." << endl;
        return 1;
    }
    string expression = argv[1];
    try {
        //Работа со строкой вида "=1+1"
        double result;
        string temp = expression;

        while (temp.find("AVERAGE") != -1 || temp.find("SUM") != -1)
        {
            if (temp.find("AVERAGE") != -1) {
                temp = functionsAverage(temp);
                if (temp.find("++") != -1) {
                    temp = removeDoublePlus(temp);
                }
            }
            if (temp.find("SUM") != -1)
            {
                temp = functionsSum(temp);
                if (temp.find("++") != -1) {
                    temp = removeDoublePlus(temp);
                }
            }
        }
        result = evaluateExpression(temp);
        cout.precision(15);  // Устанавливаем точность вывода
        cout << result << endl;
    }
    catch (const exception& e) {
        cerr << "Error: " << e.what() << endl;
    }

    return 0;
}



//Ищет первое выражение AVERAGE() и меняет его на эквивалентное выражение со стандартными операторами
string functionsAverage(const string& Expression) {
    //Например: AVERAGE(1,2,3) + 4 -> (1+2+3)/3 + 4
    string temp = Expression;
    int pos_average = temp.find("AVERAGE(");
    if (pos_average == -1)
    {
        return to_string(pos_average);
    }
    int count_left = 1;
    int count_right = 0;
    int i = pos_average + 8;

    //Массив аргументов функции
    vector<string> arr_values;

    //Переменная, хранящая аргумент функции
    string temp_word = "";

    //Алгоритм перебирает значения, пока не доберется до закрывающей
    //скобки функции AVERAGE(), либо пока не дойдет до конца строки
    while (count_left != count_right && i < temp.length())
    {
        if (count_left == count_right) { break; }

        //Если внутри функции встретилась еще одна функция или выражение со скобками, то алгоритм считывает
        //это как один аргумент
        if (temp_word == "AVERAGE(") {
            int new_count_left = 1;
            int new_count_right = 0;
            while (new_count_left != new_count_right) {
                if (temp[i] == '(')
                {
                    new_count_left += 1;
                    temp_word += temp[i];
                }
                else if (temp[i] == ')')
                {
                    new_count_right += 1;
                    temp_word += temp[i];
                }
                else {
                    temp_word += temp[i];
                }
                i++;
            }
            i++;
            arr_values.push_back(temp_word);
            temp_word = "";
        }
        if (temp_word == "(") {
            int new_count_left = 1;
            int new_count_right = 0;
            while (new_count_left != new_count_right) {
                if (temp[i] == '(')
                {
                    new_count_left += 1;
                    temp_word += temp[i];
                }
                else if (temp[i] == ')')
                {
                    new_count_right += 1;
                    temp_word += temp[i];
                }
                else {
                    temp_word += temp[i];
                }
                i++;
            }
            i++;
            arr_values.push_back(temp_word);
            temp_word = "";
        }
        if (temp_word == "SUM(")
        {
            int new_count_left = 1;
            int new_count_right = 0;
            while (new_count_left != new_count_right && i < temp.length()) {
                if (temp[i] == '(')
                {
                    new_count_left += 1;
                    temp_word += temp[i];
                }
                else if (temp[i] == ')')
                {
                    new_count_right += 1;
                    temp_word += temp[i];
                }
                else {
                    temp_word += temp[i];
                }
                i = i + 1;
            }
            i = i + 1;
            arr_values.push_back(temp_word);
            temp_word = "";
        }
        if (temp[i] == ',')
        {
            arr_values.push_back(temp_word);
            temp_word = "";
        }
        else if (temp[i] == ')')
        {

            count_right += 1;
            if (count_left == count_right) {
                arr_values.push_back(temp_word);

            }
            else {
                temp_word += temp[i];
            }
        }
        else if (temp[i] == '(' && temp_word != "AVERAGE" && temp_word != "SUM" && temp_word != "")
        {
            count_left += 1;
            temp_word += temp[i];
        }
        else {
            temp_word += temp[i];
        }
        i++;
    }
    string temp_temp = temp;
    string left_temp = temp_temp.erase(pos_average, temp.length());
    temp_temp = temp;
    string right_temp = temp_temp.erase(0, i);
    string result = "(";
    for (string s : arr_values) {
        result += s + '+';
    }
    result.pop_back();
    result += ")/" + to_string(arr_values.size());
    return left_temp + result + right_temp;
}

//Ищет первое выражение SUM() и меняет его на эквивалентное выражение со стандартными операторами 
//Например: SUM(1,2,3) + 4 -> (1+2+3) + 4
string functionsSum(const string& Expression) {
    string temp = Expression;
    int pos_sum = temp.find("SUM(");
    if (pos_sum == -1)
    {
        return to_string(pos_sum);
    }
    int count_left = 1;
    int count_right = 0;
    int i = pos_sum + 4;
    vector<string> arr_values;
    string temp_word = "";
    bool st = true;
    while (count_left != count_right && i < temp.length() && st == true)
    {
        if (i == temp.length() - 1) {
            arr_values.push_back(temp_word);
            break;
        }

        if (temp_word == "AVERAGE(") {
            int new_count_left = 1;
            int new_count_right = 0;
            while (new_count_left != new_count_right) {
                if (temp[i] == '(')
                {
                    new_count_left += 1;
                    temp_word += temp[i];
                }
                else if (temp[i] == ')')
                {
                    new_count_right += 1;
                    temp_word += temp[i];
                }
                else {
                    temp_word += temp[i];
                }
                i++;
            }
            i++;
            arr_values.push_back(temp_word);
            temp_word = "";
        }
        if (temp_word == "(") {

            int new_count_left = 1;
            int new_count_right = 0;
            while (new_count_left != new_count_right && i < temp.length()) {
                if (temp[i] == '(')
                {
                    new_count_left += 1;
                    temp_word += temp[i];
                }
                else if (temp[i] == ')')
                {
                    new_count_right += 1;
                    temp_word += temp[i];
                }
                else {
                    temp_word += temp[i];
                }
                i = i + 1;
            }

            while (temp[i] != ',' && i < temp.length()) {
                temp_word += temp[i];
                i += 1;
            }
            arr_values.push_back(temp_word);
            temp_word = "";
        }
        if (temp_word == "SUM(") {
            int new_count_left = 1;
            int new_count_right = 0;
            while (new_count_left != new_count_right) {
                if (temp[i] == '(')
                {
                    new_count_left += 1;
                    temp_word += temp[i];
                }
                else if (temp[i] == ')')
                {
                    new_count_right += 1;
                    temp_word += temp[i];
                }
                else {
                    temp_word += temp[i];
                }
                i++;
            }
            i++;
            arr_values.push_back(temp_word);
            temp_word = "";
        }
        if (temp[i] == ',')
        {
            arr_values.push_back(temp_word);
            temp_word = "";
        }
        else if (temp[i] == ')')
        {

            count_right += 1;
            if (count_left == count_right) {
                arr_values.push_back(temp_word);
                st = false;
                break;
            }
            else {
                temp_word += temp[i];
            }
        }
        else if (temp[i] == '(' && temp_word != "AVERAGE" && temp_word != "SUM" && temp_word != "")
        {
            count_left += 1;
            temp_word += temp[i];
        }
        else {
            temp_word += temp[i];
        }
        i += 1;
    }

    string temp_temp = temp;
    string left_temp = temp_temp.erase(pos_sum, temp.length());
    temp_temp = temp;
    string right_temp = temp_temp.erase(0, i + 1);

    string result = "(";
    for (string s : arr_values) {
        result += s + '+';
    }
    result.pop_back();
    result += ")";
    temp.insert(pos_sum, result);
    result = left_temp + result + right_temp;
    return result;
}


double evaluateExpression(const string& Expression)
{
    stack<double> values;
    stack<char> ops;
    string expression = Expression;
    if (char(Expression[0]) == '=')
    {
        expression = Expression.substr(1);
    }

    for (size_t i = 0; i < expression.length(); ++i)
    {
        //Пропуск пробелов в строке
        if (isspace(expression[i])) continue;

        if (isdigit(expression[i]))
        {
            double value = 0;
            while (i < expression.length() && (isdigit(expression[i]) || expression[i] == '.'))
            {
                if (expression[i] == '.')
                {
                    double decimalPlace = 0.1;
                    ++i;
                    while (i < expression.length() && isdigit(expression[i]))
                    {
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
            --i; // Уменьшаем i, так как в конце цикла оно увеличится
        }
        else if (expression[i] == '(')
        {
            ops.push(expression[i]);
        }
        else if (expression[i] == ')')
        {
            while (!ops.empty() && ops.top() != '(')
            {
                double right = values.top(); values.pop();
                double left = values.top(); values.pop();
                char op = ops.top(); ops.pop();
                values.push(applyOperation(left, right, op));
            }
            ops.pop(); // Удаляем '('
        }
        else if (strchr("+-*/", expression[i]))
        {
            while (!ops.empty() && precedence(ops.top()) >= precedence(expression[i]))
            {
                double right = values.top(); values.pop();
                double left = values.top(); values.pop();
                char op = ops.top(); ops.pop();
                values.push(applyOperation(left, right, op));
            }
            ops.push(expression[i]);
        }
    }

    while (!ops.empty())
    {
        double right = values.top(); values.pop();
        double left = values.top(); values.pop();
        char op = ops.top(); ops.pop();
        values.push(applyOperation(left, right, op));
    }

    return values.top();
}


//Функция для вычисления значения выражения вида "A [операция] B"
double applyOperation(double a, double b, char op)
{
    switch (op)
    {
    case '+': return a + b;
    case '-': return a - b;
    case '*': return a * b;
    case '/':
        if (b == 0) throw runtime_error("Division by zero");
        return a / b;
    }
    throw runtime_error("Unknown operation or extra parenthesis");
}

//Функция для определения приоритета операций
int precedence(char op) {
    if (op == '+' || op == '-') return 1;
    if (op == '*' || op == '/') return 2;
    return 0;
}

//Вспомогательная функция для удаления двойных плюсов
string removeDoublePlus(const string& input) {
    string result = "";
    for (size_t i = 0; i < input.length(); ++i) {
        if (input[i] == '+' && i + 1 < input.length() && input[i + 1] == '+') {
            result += '+';
            i++; // Пропускаем второй '+'
        }
        else {
            result += input[i];
        }
    }
    return result;
}