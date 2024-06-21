document.addEventListener("DOMContentLoaded", function () {
  const chart = document.getElementById("chart");
  const data = [0, 1, 0, 30, 5, 40, 45, 50, 55, 60, 10, 15, 20, 25, 30];

  let max = Math.max(...data);
  
  for (let i = 0; i < data.length; i++) {
    const bar = document.createElement("div");
    bar.classList.add("bar");
    bar.style.height = `${(data[i]/max)*100}%`;
    chart.appendChild(bar);
  }

  for (let i = 0; i < data.length; i++) {
    const label = document.createElement("div");
    label.classList.add("label");
    label.innerText = data[i];
    chart.appendChild(label);
  }
});
