#include <iostream>
#include <vector>
#include <algorithm>

class Calculator {
private:
    std::vector<double> history;

public:
    double add(double a, double b) {
        double result = a + b;
        history.push_back(result);
        return result;
    }

    double multiply(double a, double b) {
        double result = a * b;
        history.push_back(result);
        return result;
    }

    void printHistory() {
        std::cout << "Calculation History:" << std::endl;
        for (const auto& result : history) {
            std::cout << "Result: " << result << std::endl;
        }
    }
};

int main() {
    Calculator calc;

    // Test calculations
    double sum = calc.add(10.5, 20.3);
    double product = calc.multiply(5.0, 4.0);

    std::cout << "Sum: " << sum << std::endl;
    std::cout << "Product: " << product << std::endl;

    calc.printHistory();

    return 0;
}
