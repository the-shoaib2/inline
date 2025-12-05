def simple_calculator():
    """Simple calculator in Python"""
    print("Simple Calculator")
    print("Operations: +, -, *, /")


    try:
        num1 = float(input("Enter first number: "))
        operator = input("Enter operator: ")
        num2 = float(input("Enter second number: "))

        if operator == '+':
            result = num1 + num2
        elif operator == '-':
            result = num1 - num2
        elif operator == '*':
            result = num1 * num2
        elif operator == '/':
            if num2 != 0:
                result = num1 / num2
            else:
                return "Error: Division by zero"
        else:
            return "Error: Invalid operator"


        return f"{num1} {operator} {num2} = {result}"

    except ValueError:
        return "Error: Please enter valid numbers"

# Run calculator
if __name__ == "__main__":
    result = simple_calculator()
    print(result)
