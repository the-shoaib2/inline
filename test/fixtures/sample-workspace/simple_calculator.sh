#!/bin/bash

# Simple Calculator in Shell

echo "Simple Calculator"
echo "Operations: +, -, *, /"

read -p "Enter first number: " num1
read -p "Enter operator: " op
read -p "Enter second number: " num2

case $op in
    '+')
        result=$((num1 + num2))
        echo "$num1 + $num2 = $result"
        ;;
    '-')
        result=$((num1 - num2))
        echo "$num1 - $num2 = $result"
        ;;
    '*')
        result=$((num1 * num2))
        echo "$num1 * $num2 = $result"
        ;;
    '/')
        if [ $num2 -ne 0 ]; then
            result=$((num1 / num2))
            echo "$num1 / $num2 = $result"
        else
            echo "Error: Division by zero"
        fi
        ;;
    *)
        echo "Error: Invalid operator"
        ;;
esac
