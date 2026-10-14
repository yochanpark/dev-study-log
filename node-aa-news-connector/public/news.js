// 직접 추가: 지금 목록을 받아 한 건 붙여 다시 보낸다
document.getElementById("newsForm").addEventListener("submit", async function (event) {
    event.preventDefault();
    const title = document.getElementById("newsTitle").value.trim();
    const newsList = await (await fetch("/news/list/json")).json();
    newsList.push({ newstitle: title });

    await fetch("/rpa/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newsList),
    });
    window.location.href = "/news/list";
});

// 봇 실행: 결과는 봇이 끝난 뒤 /rpa/news로 들어온다
document.getElementById("botForm").addEventListener("submit", async function (event) {
    event.preventDefault();
    const keyword = document.getElementById("keyword").value.trim();
    const response = await fetch("/run-bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword }),
    });
    const data = await response.json();
    alert(data.result === "ok" ? `봇을 실행했습니다. (${data.deploymentId})` : `실패: ${data.message}`);
});
