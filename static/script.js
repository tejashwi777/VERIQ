
let selectedCount = 10;
let generatedUsers = [];

const generateBtn = document.getElementById("generateBtn");
const recordsBody = document.getElementById("recordsBody");
const searchInput = document.getElementById("searchInput");
const exportBtn = document.getElementById("exportBtn");

document.querySelectorAll(".count-btn").forEach(button => {
    button.addEventListener("click", () => {
        document.querySelectorAll(".count-btn").forEach(btn => {
            btn.classList.remove("active");
        });

        button.classList.add("active");
        selectedCount = Number(button.dataset.count);
    });
});

generateBtn.addEventListener("click", async () => {
    generateBtn.disabled = true;
    generateBtn.textContent = "Generating...";

    try {
        const response = await fetch("/generate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ count: selectedCount })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Generation failed");
        }

        generatedUsers = result.users;

        updateStats(result);
        displayRecords(generatedUsers);

        document.getElementById("recordSummary").textContent =
            `${result.total} records generated`;

        showToast(`${result.total} test records generated successfully!`);

    } catch (error) {
        showToast(error.message);
    } finally {
        generateBtn.disabled = false;
        generateBtn.innerHTML = "<span>✧</span> Generate test data";
    }
});

function updateStats(result) {
    document.getElementById("totalCount").textContent = result.total;
    document.getElementById("validCount").textContent = result.valid;
    document.getElementById("invalidCount").textContent = result.invalid;
}

function displayRecords(users) {
    recordsBody.innerHTML = "";

    if (users.length === 0) {
        recordsBody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <div class="empty-icon">⌕</div>
                    <strong>No matching records</strong>
                    <p>Try another search term.</p>
                </td>
            </tr>
        `;
        return;
    }

    users.forEach((user, index) => {
        const row = document.createElement("tr");

        const number = document.createElement("td");
        number.textContent = index + 1;

        const name = document.createElement("td");
        name.textContent = user.name;

        const email = document.createElement("td");
        email.textContent = user.email;

        const phone = document.createElement("td");
        phone.textContent = user.phone;

        const statusCell = document.createElement("td");
        const status = document.createElement("span");
        status.className = `status ${user.status.toLowerCase()}`;
        status.textContent = user.status;
        status.title = user.errors.join(", ") || "All checks passed";
        statusCell.appendChild(status);

        const action = document.createElement("td");
        const copyButton = document.createElement("button");
        copyButton.className = "copy-btn";
        copyButton.textContent = "Copy";
        copyButton.addEventListener("click", () => copyRecord(user));

        action.appendChild(copyButton);

        row.append(number, name, email, phone, statusCell, action);
        recordsBody.appendChild(row);
    });
}

searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase().trim();

    const filtered = generatedUsers.filter(user =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.phone.includes(query) ||
        user.status.toLowerCase().includes(query)
    );

    displayRecords(filtered);
});

async function copyRecord(user) {
    const text = `${user.name}, ${user.email}, ${user.phone}, ${user.status}`;

    try {
        await navigator.clipboard.writeText(text);
        showToast("Record copied!");
    } catch {
        showToast("Clipboard access unavailable.");
    }
}

exportBtn.addEventListener("click", async () => {
    if (generatedUsers.length === 0) {
        showToast("Generate records before exporting.");
        return;
    }

    try {
        const response = await fetch("/export", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ users: generatedUsers })
        });

        if (!response.ok) {
            throw new Error("CSV export failed");
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = "veriq_test_data.csv";
        link.click();

        URL.revokeObjectURL(url);
        showToast("CSV downloaded successfully!");

    } catch (error) {
        showToast(error.message);
    }
});

function showToast(message) {
    const toast = document.getElementById("toast");

    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}
