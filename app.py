
from flask import Flask, render_template, request, jsonify, make_response
import random
import csv
import io
import re

app = Flask(__name__)

FIRST_NAMES = [
    "Aarav", "Sita", "Aayush", "Anisha", "Rohan",
    "Priya", "Samir", "Nisha", "Kabir", "Maya",
    "Arjun", "Sneha", "Bibek", "Asha", "Nabin"
]

LAST_NAMES = [
    "Sharma", "Karki", "Thapa", "Gurung", "Rai",
    "Shrestha", "Adhikari", "Basnet", "KC", "Joshi"
]


def generate_user():
    first = random.choice(FIRST_NAMES)
    last = random.choice(LAST_NAMES)
    name = f"{first} {last}"

    domains = ["gmail.com", "outlook.com", "example.com"]
    email = f"{first.lower()}.{last.lower()}{random.randint(1, 99)}@{random.choice(domains)}"

    phone = "98" + "".join(str(random.randint(0, 9)) for _ in range(8))

    return {
        "name": name,
        "email": email,
        "phone": phone
    }


def validate_user(user):
    errors = []

    if not re.match(r"^[\w.+-]+@[\w-]+\.[\w.-]+$", user["email"]):
        errors.append("Invalid email")

    if not re.match(r"^98\d{8}$", user["phone"]):
        errors.append("Invalid phone")

    return errors


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/generate", methods=["POST"])
def generate():
    data = request.get_json()
    count = int(data.get("count", 10))

    if count < 1 or count > 100:
        return jsonify({"error": "Choose between 1 and 100 records"}), 400

    users = [generate_user() for _ in range(count)]
    seen_emails = set()

    for user in users:
        errors = validate_user(user)

        if user["email"] in seen_emails:
            errors.append("Duplicate email")

        seen_emails.add(user["email"])

        user["status"] = "Invalid" if errors else "Valid"
        user["errors"] = errors

    return jsonify({
        "users": users,
        "total": len(users),
        "valid": sum(u["status"] == "Valid" for u in users),
        "invalid": sum(u["status"] == "Invalid" for u in users)
    })


@app.route("/export", methods=["POST"])
def export():
    data = request.get_json()
    users = data.get("users", [])

    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow(["Name", "Email", "Phone", "Status"])

    for user in users:
        writer.writerow([
            user.get("name", ""),
            user.get("email", ""),
            user.get("phone", ""),
            user.get("status", "")
        ])

    response = make_response(output.getvalue())
    response.headers["Content-Disposition"] = "attachment; filename=veriq_test_data.csv"
    response.headers["Content-Type"] = "text/csv"

    return response


if __name__ == "__main__":
    app.run(debug=True, port=5001)
