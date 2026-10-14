const PAGE_SIZE = 8;

document.addEventListener("DOMContentLoaded", function () {
    function loadBoardData(page) {
        fetch(`/api/board?page=${page}`)
            .then((response) => {
                if (response.status === 401) {
                    window.location.href = "/";
                    return null;
                }
                return response.json();
            })
            .then((data) => {
                if (!data) return;
                if (!data.success) return alert(data.message);

                const tableBody = document.getElementById("board-list");
                tableBody.innerHTML = "";

                // 순번은 페이지를 넘겨도 이어지게
                const startNumber = (page - 1) * PAGE_SIZE + 1;

                data.data.forEach((item, index) => {
                    const row = document.createElement("tr");
                    row.appendChild(cell(startNumber + index, "col-number"));
                    row.appendChild(cell(item.id, "col-id"));
                    row.appendChild(cell(item.name, "col-name"));

                    const editButton = document.createElement("button");
                    editButton.textContent = "수정";
                    editButton.classList.add("edit-btn");
                    editButton.addEventListener("click", () => {
                        window.location.href = `edit.html?id=${encodeURIComponent(item.id)}`;
                    });
                    const tdEdit = document.createElement("td");
                    tdEdit.appendChild(editButton);
                    row.appendChild(tdEdit);

                    tableBody.appendChild(row);
                });

                createPagination(data.totalPages, data.currentPage);
            })
            .catch((err) => console.error("회원 목록 불러오기 실패:", err));
    }

    function cell(text, className) {
        const td = document.createElement("td");
        td.textContent = text;
        td.classList.add(className);
        return td;
    }

    function createPagination(totalPages, currentPage) {
        const pagination = document.getElementById("pagination");
        pagination.innerHTML = "";
        for (let i = 1; i <= totalPages; i++) {
            const pageButton = document.createElement("button");
            pageButton.textContent = i;
            pageButton.classList.add("page-btn");
            pageButton.disabled = i === currentPage;
            pageButton.addEventListener("click", () => loadBoardData(i));
            pagination.appendChild(pageButton);
        }
    }

    loadBoardData(1);

    document.getElementById("add-btn").addEventListener("click", () => {
        window.location.href = "add.html";
    });

    document.getElementById("logout-btn").addEventListener("click", async () => {
        try {
            const data = await (await fetch("/api/logout", { method: "POST" })).json();
            if (data.success) window.location.href = "/";
        } catch (err) {
            alert("로그아웃 실패");
        }
    });
});
