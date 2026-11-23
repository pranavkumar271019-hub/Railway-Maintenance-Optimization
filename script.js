function showMessage() {
    document.getElementById("maintenance").scrollIntoView({
        behavior: "smooth"
    });
}
const form = document.getElementById("maintenanceForm");

let totalConflicts = 0;

form.addEventListener("submit", function(event) {
    event.preventDefault();

    const department = document.getElementById("department").value;
    const asset = document.getElementById("assetType").value;
    const assetId = document.getElementById("assetId").value.trim();
    const date = document.getElementById("date").value;
    const start = document.getElementById("startTime").value;
    const end = document.getElementById("endTime").value;
    const priority = document.getElementById("priority").value;

    if (end <= start) {
        alert("End time must be after start time!");
        return;
    }

    const table = document.getElementById("requestTable");
    const rows = Array.from(table.querySelectorAll("tr"));

    const conflict = rows.some(function(row) {
        const existingAsset = row.cells[2].textContent;
        const existingDate = row.cells[3].textContent;
        const existingTime = row.cells[4].textContent;

        const times = existingTime.split(" - ");
        const existingStart = times[0];
        const existingEnd = times[1];

        return (
            existingAsset.toLowerCase() === assetId.toLowerCase() &&
            existingDate === date &&
            start < existingEnd &&
            end > existingStart
        );
    });

    const row = document.createElement("tr");

    const values = [
        department,
        asset,
        assetId,
        date,
        start + " - " + end,
        priority,
        conflict ? "Conflict Detected" : "No Conflict"
    ];

    values.forEach(function(value) {
        const cell = document.createElement("td");
        cell.textContent = value;
        row.appendChild(cell);
    });

    table.appendChild(row);

    if (conflict) {
        totalConflicts++;
        alert("Warning! Maintenance Scheduling Conflict Detected!");
    } else {
        alert("Maintenance Request Submitted Successfully!");
    }

    form.reset();
});
document.getElementById("runFCFS").addEventListener("click", function() {

    const rows = Array.from(
        document.getElementById("requestTable").querySelectorAll("tr")
    );

    const resultTable = document.getElementById("fcfsTable");

    resultTable.innerHTML = "";

    let scheduled = [];
    let conflicts = 0;

    rows.forEach(function(row, index) {

        const department = row.cells[0].textContent;
        const assetId = row.cells[2].textContent;
        const date = row.cells[3].textContent;
        const time = row.cells[4].textContent;

        const times = time.split(" - ");
        const start = times[0];
        const end = times[1];

        const conflict = scheduled.some(function(item) {

            return (
                item.assetId.toLowerCase() === assetId.toLowerCase() &&
                item.date === date &&
                start < item.end &&
                end > item.start
            );

        });

        let status;

        if (conflict) {
            status = "Conflict - Not Scheduled";
            conflicts++;
        } else {
            status = "Scheduled";

            scheduled.push({
                assetId: assetId,
                date: date,
                start: start,
                end: end
            });
        }

        const newRow = document.createElement("tr");

        [
            "REQ-" + (index + 1),
            department,
            assetId,
            date,
            time,
            status
        ].forEach(function(value) {

            const cell = document.createElement("td");
            cell.textContent = value;
            newRow.appendChild(cell);

        });

        resultTable.appendChild(newRow);

    });

    document.getElementById("fcfsTotal").textContent = rows.length;

    document.getElementById("fcfsScheduled").textContent =
        scheduled.length;

    document.getElementById("fcfsConflicts").textContent =
        conflicts;

    alert("FCFS Scheduling Completed Successfully!");

});
document.getElementById("runOptimization").addEventListener("click", function() {

    const rows = Array.from(
        document.getElementById("requestTable").querySelectorAll("tr")
    );

    const resultTable = document.getElementById("optimizationTable");

    resultTable.innerHTML = "";

    let requests = [];

    rows.forEach(function(row, index) {

        const time = row.cells[4].textContent.split(" - ");

        const start = time[0];
        const end = time[1];

        const startMinutes = Number(start.split(":")[0]) * 60 +
            Number(start.split(":")[1]);

        const endMinutes = Number(end.split(":")[0]) * 60 +
            Number(end.split(":")[1]);

        requests.push({
            id: "REQ-" + (index + 1),
            department: row.cells[0].textContent,
            assetId: row.cells[2].textContent,
            date: row.cells[3].textContent,
            start: start,
            end: end,
            startMinutes: startMinutes,
            endMinutes: endMinutes,
            duration: (endMinutes - startMinutes) / 60
        });

    });

    requests.sort(function(a, b) {
        if (a.assetId !== b.assetId) {
            return a.assetId.localeCompare(b.assetId);
        }

        if (a.date !== b.date) {
            return a.date.localeCompare(b.date);
        }

        return a.endMinutes - b.endMinutes;
    });

    let accepted = [];
    let rejected = [];

    requests.forEach(function(request) {

        const conflict = accepted.some(function(item) {

            return (
                item.assetId === request.assetId &&
                item.date === request.date &&
                request.startMinutes < item.endMinutes &&
                request.endMinutes > item.startMinutes
            );

        });

        if (conflict) {
            rejected.push(request);
        } else {
            accepted.push(request);
        }

    });

    let lostHours = 0;

    requests.forEach(function(request) {
        lostHours += request.duration;
    });

    let optimizedHours = accepted.reduce(function(total, request) {
        return total + request.duration;
    }, 0);

    const availabilityLost = Math.max(0, lostHours - optimizedHours);

    const results = [
        ...accepted.map(request => ({
            ...request,
            status: "Scheduled"
        })),
        ...rejected.map(request => ({
            ...request,
            status: "Conflict Avoided"
        }))
    ];

    results.forEach(function(request) {

        const row = document.createElement("tr");

        [
            request.id,
            request.department,
            request.assetId,
            request.date,
            request.start + " - " + request.end,
            request.duration + " Hours",
            request.status
        ].forEach(function(value) {

            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);

        });

        resultTable.appendChild(row);

    });

    document.getElementById("optTotal").textContent = requests.length;

    document.getElementById("optScheduled").textContent = accepted.length;

    document.getElementById("optConflicts").textContent = rejected.length;

    document.getElementById("optLost").textContent =
        availabilityLost.toFixed(2) + " Hours";

    alert("Joint Optimization Completed Successfully!");

});
document.getElementById("generateGantt").addEventListener("click",function(){
    const table=document.getElementById("optimizationTable");
    const chart=document.getElementById("ganttChart");
    const rows=table.querySelectorAll("tr");

    if(rows.length===0){
        chart.innerHTML="<p>Please generate the optimized schedule first.</p>";
        return;
    }

    let html=`
        <div class="gantt-axis">
            <div>Asset ID</div>
            <div class="gantt-hours">
                <span>00:00</span>
                <span>04:00</span>
                <span>08:00</span>
                <span>12:00</span>
                <span>16:00</span>
                <span>20:00</span>
                <span>24:00</span>
            </div>
        </div>
    `;

    let count=0;

    rows.forEach(function(row){
        const cells=row.querySelectorAll("td");
        if(cells.length<7)return;

        const asset=cells[2].textContent.trim();
        const time=cells[4].textContent.trim();
        const status=cells[6].textContent.trim();

        const parts=time.split("-");
        if(parts.length!==2)return;

        function toMinutes(value){
            const t=value.trim().split(":");
            return Number(t[0])*60+Number(t[1]);
        }

        const start=toMinutes(parts[0]);
        const end=toMinutes(parts[1]);

        if(end<=start)return;

        const left=(start/1440)*100;
        const width=((end-start)/1440)*100;

        const className=status.includes("Scheduled") && !status.includes("Conflict")
            ?"gantt-scheduled":"gantt-conflict";

        html+=`
            <div class="gantt-row">
                <div class="gantt-label">${asset}</div>
                <div class="gantt-track">
                    <div class="gantt-block ${className}"
                    style="left:${left}%;width:${width}%"
                    title="${asset} | ${time} | ${status}">
                    ${time}
                    </div>
                </div>
            </div>
        `;
        count++;
    });

    if(count===0){
        chart.innerHTML="<p>No valid schedule found. Generate the optimized schedule first.</p>";
        return;
    }

    html+=`
        <div class="gantt-legend">
            <span style="color:#16a34a">■ Scheduled</span>
            &nbsp;&nbsp;
            <span style="color:#dc2626">■ Conflict Avoided</span>
        </div>
    `;

    chart.innerHTML=html;
});
document.getElementById("compareSchedules").addEventListener("click",function(){

    function getNumber(id){
        const element=document.getElementById(id);
        return element ? Number(element.textContent.trim()) || 0 : 0;
    }

    const fcfsTotal=getNumber("fcfsTotal");
    const fcfsScheduled=getNumber("fcfsScheduled");
    const fcfsConflicts=getNumber("fcfsConflicts");

    const optTotal=getNumber("optTotal");
    const optScheduled=getNumber("optScheduled");
    const optConflicts=getNumber("optConflicts");

    document.getElementById("compareFcfsTotal").textContent=fcfsTotal;
    document.getElementById("compareFcfsScheduled").textContent=fcfsScheduled;
    document.getElementById("compareFcfsConflicts").textContent=fcfsConflicts;

    document.getElementById("compareOptTotal").textContent=optTotal;
    document.getElementById("compareOptScheduled").textContent=optScheduled;
    document.getElementById("compareOptConflicts").textContent=optConflicts;

    const additional=optScheduled-fcfsScheduled;
    const reduced=fcfsConflicts-optConflicts;

    document.getElementById("additionalScheduled").textContent=additional;
    document.getElementById("conflictsReduced").textContent=reduced;

    let message="Both scheduling methods have been compared.";

    if(optScheduled>fcfsScheduled){
        message="Optimized scheduling scheduled more maintenance requests than FCFS.";
    }else if(optScheduled<fcfsScheduled){
        message="FCFS scheduled more requests than the current optimized method.";
    }else{
        message="Both methods scheduled the same number of requests.";
    }

    document.getElementById("comparisonMessage").textContent=message;
});
document.getElementById("refreshReport").addEventListener("click",function(){

    function getRows(id){
        const table=document.getElementById(id);
        return table ? table.querySelectorAll("tr").length : 0;
    }

    const totalRequests=getRows("requestTable");
    const totalAssets=getRows("assetTable");
    const totalDepartments=getRows("departmentTable");

    let scheduled=0;
    let conflicts=0;
    let pending=0;

    const optimizationTable=document.getElementById("optimizationTable");

    if(optimizationTable){
        optimizationTable.querySelectorAll("tr").forEach(function(row){
            const cells=row.querySelectorAll("td");
            if(cells.length<7)return;

            const status=cells[6].textContent.trim();

            if(status.includes("Scheduled") && !status.includes("Conflict")){
                scheduled++;
            }else{
                conflicts++;
            }
        });
    }

    pending=Math.max(0,totalRequests-scheduled-conflicts);

    document.getElementById("reportRequests").textContent=totalRequests;
    document.getElementById("reportAssets").textContent=totalAssets;
    document.getElementById("reportDepartments").textContent=totalDepartments;
    document.getElementById("reportScheduled").textContent=scheduled;
    document.getElementById("reportConflicts").textContent=conflicts;
    document.getElementById("reportPending").textContent=pending;

    document.getElementById("reportSummary").textContent=
        "The system has received "+totalRequests+
        " maintenance requests. Out of these, "+scheduled+
        " requests are scheduled and "+conflicts+
        " requests have scheduling conflicts. The system currently manages "+
        totalAssets+" assets across "+totalDepartments+" departments.";
});
document.getElementById("loginForm").addEventListener("submit",function(event){
    event.preventDefault();

    const username=document.getElementById("loginUsername").value.trim();
    const password=document.getElementById("loginPassword").value;
    const role=document.getElementById("loginRole").value;
    const message=document.getElementById("loginMessage");

    if(username==="admin" && password==="admin123" && role==="Admin"){
        message.textContent="Admin Login Successful!";
        message.style.color="green";
        sessionStorage.setItem("railwayLoggedIn", "true");
        document.body.classList.add("logged-in");
    }
    else if(username==="department" && password==="dept123" && role==="Department"){
        message.textContent="Department Login Successful!";
        message.style.color="green";
    }
    else{
        message.textContent="Invalid username, password or role!";
        message.style.color="red";
    }
});
// STEP 21: SAVE PROJECT DATA IN BROWSER

const storageKey="railwayMaintenanceData";

function saveProjectData(){
    const data={};

    document.querySelectorAll("tbody").forEach(function(table,index){
        data["table_"+index]=table.innerHTML;
    });

    localStorage.setItem(storageKey,JSON.stringify(data));

    const status=document.getElementById("storageStatus");
    if(status){
        status.textContent="All project data saved successfully!";
    }
}

function loadProjectData(){
    const savedData=localStorage.getItem(storageKey);

    if(!savedData)return;

    const data=JSON.parse(savedData);

    document.querySelectorAll("tbody").forEach(function(table,index){
        const key="table_"+index;

        if(data[key]!==undefined){
            table.innerHTML=data[key];
        }
    });

    const status=document.getElementById("storageStatus");
    if(status){
        status.textContent="Previously saved project data loaded successfully!";
    }
}

loadProjectData();

document.querySelectorAll("tbody").forEach(function(table){
    const observer=new MutationObserver(function(){
        saveProjectData();
    });

    observer.observe(table,{
        childList:true,
        subtree:true,
        characterData:true
    });
});

document.getElementById("clearProjectData").addEventListener("click",function(){
    const confirmation=confirm("Are you sure you want to delete all saved project data?");

    if(confirmation){
        localStorage.removeItem(storageKey);
        location.reload();
    }
});
document.getElementById("calculateAvailability").addEventListener("click",function(){

    const table=document.getElementById("optimizationTable");
    const rows=table.querySelectorAll("tr");

    if(rows.length===0){
        document.getElementById("availabilityMessage").textContent=
            "Please generate the optimized schedule first.";
        return;
    }

    let assetDays=new Set();
    let maintenance=0;

    rows.forEach(function(row){
        const cells=row.querySelectorAll("td");
        if(cells.length<7)return;

        const asset=cells[2].textContent.trim();
        const date=cells[3].textContent.trim();
        const time=cells[4].textContent.trim();
        const status=cells[6].textContent.trim();

        if(!status.includes("Scheduled") || status.includes("Conflict"))return;

        const parts=time.split("-");
        if(parts.length!==2)return;

        function minutes(value){
            const t=value.trim().split(":");
            return Number(t[0])*60+Number(t[1]);
        }

        const duration=minutes(parts[1])-minutes(parts[0]);

        if(duration<=0)return;

        assetDays.add(asset+"_"+date);
        maintenance+=duration/60;
    });

    const totalHours=assetDays.size*24;
    const available=totalHours-maintenance;
    const percentage=totalHours>0?(available/totalHours)*100:0;

    document.getElementById("totalAssetHours").textContent=totalHours.toFixed(2)+" hrs";
    document.getElementById("maintenanceHours").textContent=maintenance.toFixed(2)+" hrs";
    document.getElementById("availableHours").textContent=available.toFixed(2)+" hrs";
    document.getElementById("availabilityPercent").textContent=percentage.toFixed(2)+"%";
    document.getElementById("availabilityBar").style.width=percentage+"%";

    document.getElementById("availabilityMessage").textContent=
        "Asset availability calculated successfully using the optimized schedule.";
});
let performanceChart=null;
let distributionChart=null;

document.getElementById("generateAnalytics").addEventListener("click",function(){

    const fcfsScheduled=Number(document.getElementById("fcfsScheduled").textContent)||0;
    const fcfsConflicts=Number(document.getElementById("fcfsConflicts").textContent)||0;

    const optScheduled=Number(document.getElementById("optScheduled").textContent)||0;
    const optConflicts=Number(document.getElementById("optConflicts").textContent)||0;

    const scheduledTable=document.getElementById("optimizationTable");
    let scheduled=0;
    let conflicts=0;

    scheduledTable.querySelectorAll("tr").forEach(function(row){
        const cells=row.querySelectorAll("td");
        if(cells.length<7)return;

        const status=cells[6].textContent.trim();

        if(status.includes("Scheduled") && !status.includes("Conflict")){
            scheduled++;
        }else{
            conflicts++;
        }
    });

    if(performanceChart)performanceChart.destroy();

    performanceChart=new Chart(document.getElementById("performanceChart"),{
        type:"bar",
        data:{
            labels:["Scheduled Requests","Conflicts"],
            datasets:[
                {
                    label:"FCFS Scheduling",
                    data:[fcfsScheduled,fcfsConflicts],
                    backgroundColor:"#2563eb"
                },
                {
                    label:"Optimized Scheduling",
                    data:[optScheduled,optConflicts],
                    backgroundColor:"#16a34a"
                }
            ]
        },
        options:{
            responsive:true,
            maintainAspectRatio:false,
            scales:{
                y:{
                    beginAtZero:true,
                    ticks:{precision:0}
                }
            }
        }
    });

    if(distributionChart)distributionChart.destroy();

    distributionChart=new Chart(document.getElementById("distributionChart"),{
        type:"pie",
        data:{
            labels:["Scheduled","Conflicts"],
            datasets:[{
                data:[scheduled,conflicts],
                backgroundColor:["#16a34a","#dc2626"]
            }]
        },
        options:{
            responsive:true,
            maintainAspectRatio:false
        }
    });
});

async function loadRailwayAssets() {
    try {
        const response = await fetch("http://localhost:3000/api/assets");

        if (!response.ok) {
            throw new Error("Failed to fetch railway assets");
        }

        const data = await response.json();

        if (data.success) {
            const assets = data.assets;

            const totalAssets = assets.length;

            const availableAssets = assets.filter(
                asset => asset.status === "Available"
            ).length;

            document.getElementById("totalAssets").textContent = totalAssets;

            document.getElementById("availableAssets").textContent = availableAssets;

            console.log("Railway assets loaded successfully:", assets);
        }

    } catch (error) {
        console.error("API Error:", error);
    }
}

document.addEventListener("DOMContentLoaded", loadRailwayAssets);
// LOGIN PAGE INITIALIZATION
document.addEventListener("DOMContentLoaded", function () {
    const main = document.querySelector("main");
    const loginSection = document.querySelector(".login-section");

    if (main && loginSection) {
        main.prepend(loginSection);
    }

    // Restore login during the current browser session
    if (sessionStorage.getItem("railwayLoggedIn") === "true") {
        document.body.classList.add("logged-in");
    }
});
// ADD NEW RAILWAY ASSET
const assetForm = document.getElementById("assetForm");

if (assetForm) {
    assetForm.addEventListener("submit", function(event) {
        event.preventDefault();

        const assetId = document.getElementById("newAssetId").value.trim();
        const assetName = document.getElementById("newAssetName").value.trim();
        const assetType = document.getElementById("newAssetType").value;
        const location = document.getElementById("newAssetLocation").value.trim();
        const status = document.getElementById("newAssetStatus").value;

        if (!assetId || !assetName || !assetType || !location) {
            alert("Please fill all asset details!");
            return;
        }

        const table = document.getElementById("assetTable");

        const existingAssets = Array.from(table.querySelectorAll("tr"));

        const duplicate = existingAssets.some(row =>
            row.cells[0].textContent.trim().toLowerCase() === assetId.toLowerCase()
        );

        if (duplicate) {
            alert("Asset ID already exists!");
            return;
        }

        const newRow = table.insertRow();

        newRow.innerHTML = `
            <td>${assetId}</td>
            <td>${assetName}</td>
            <td>${assetType}</td>
            <td>${location}</td>
            <td>${status}</td>
        `;

        assetForm.reset();

        alert("New Railway Asset Added Successfully!");
    });
}
    // DEPARTMENT MANAGEMENT
const departmentForm = document.getElementById("departmentForm");

if (departmentForm) {
    departmentForm.addEventListener("submit", function(event) {
        event.preventDefault();

        const id = document.getElementById("departmentId").value.trim();
        const name = document.getElementById("departmentName").value;
        const head = document.getElementById("departmentHead").value.trim();
        const contact = document.getElementById("departmentContact").value.trim();

        if (!id || !name || !head || !contact) {
            alert("Please fill all department details!");
            return;
        }

        const table = document.getElementById("departmentTable");

        if (!table) {
            alert("Department table not found!");
            return;
        }

        const duplicate = Array.from(table.querySelectorAll("tr")).some(row =>
            row.cells[0].textContent.trim().toLowerCase() === id.toLowerCase()
        );

        if (duplicate) {
            alert("Department ID already exists!");
            return;
        }

        const newRow = table.insertRow();

        [id, name, head, contact].forEach(value => {
            const cell = newRow.insertCell();
            cell.textContent = value;
        });

        departmentForm.reset();
        alert("Department Added Successfully!");
    });
}

 