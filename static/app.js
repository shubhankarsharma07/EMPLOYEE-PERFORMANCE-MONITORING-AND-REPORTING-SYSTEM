// app.js — robust, waits for DOM, safe guards, with PDF export
document.addEventListener("DOMContentLoaded", () => {
  const API_URL = "/api/employee/full-profile";

  const $ = id => document.getElementById(id);
  const fetchBtn = $("fetchBtn");
  const clearBtn = $("clearBtn");
  const downloadPdfBtn = $("downloadPdfBtn");
  const statusEl = $("status");
  const profileArea = $("profileArea");

  // profile fields
  const nameEl = $("name");
  const roleDeptEl = $("roleDept");
  const emailEl = $("email");
  const phoneEl = $("phone");
  const joinedEl = $("joined");
  const initialEl = $("initial");
  const projectsList = $("projectsList");
  const attendanceList = $("attendanceList");
  const tasksTableBody = $("tasksTable");
  const taskCount = $("taskCount");
  const avgScore = $("avgScore");
  const reviewSummary = $("reviewSummary");
  const tasksChartCanvas = $("tasksChart");

  let chartInstance = null;
  let currentProfileData = null;

  function safeText(el, txt){
    if(!el) return;
    el.innerText = txt ?? "—";
  }
  function setStatus(msg, color){
    if(!statusEl) return;
    statusEl.innerText = msg;
    statusEl.style.color = color || "";
  }

  function fmtDate(d){
    if(!d) return "-";
    const dt = new Date(d);
    if(isNaN(dt)) return d;
    return dt.toLocaleDateString();
  }

  async function fetchProfile(id){
    if(!id) { setStatus("Enter employee id", "#ffb86b"); return; }
    setStatus("Loading...");
    if(profileArea) profileArea.hidden = true;
    if(downloadPdfBtn) downloadPdfBtn.style.display = "none";

    try {
      const res = await fetch(`${API_URL}?employee_id=${id}`);
      if(!res.ok) {
        const body = await res.json().catch(()=>({detail:'error'}));
        throw new Error(body.detail || `Status ${res.status}`);
      }
      const data = await res.json();
      currentProfileData = data;
      renderProfile(data);
      setStatus("Loaded");
      if(downloadPdfBtn) downloadPdfBtn.style.display = "inline-block";
    } catch(err) {
      console.error(err);
      setStatus("Error: " + (err.message || "unknown"), "#ff6b6b");
      if(profileArea) profileArea.hidden = true;
      if(downloadPdfBtn) downloadPdfBtn.style.display = "none";
      currentProfileData = null;
    }
  }

  function clearUI(){
    if(profileArea) profileArea.hidden = true;
    const input = $("employeeId");
    if(input) input.value = "";
    setStatus("Ready");
    if(chartInstance){ chartInstance.destroy(); chartInstance = null; }
    if(taskCount) taskCount.innerText = "0";
    if(avgScore) avgScore.innerText = "—";
    if(downloadPdfBtn) downloadPdfBtn.style.display = "none";
    currentProfileData = null;
  }

  function renderProfile(data){
    if(!data) return;
    if(profileArea) profileArea.hidden = false;

    const emp = data.employee || {};
    const role = data.role || {};
    const dept = data.department || {};
    const tasks = Array.isArray(data.tasks) ? data.tasks : [];
    const attendance = Array.isArray(data.attendance) ? data.attendance : [];
    const projects = Array.isArray(data.projects) ? data.projects : [];
    const review = data.performance_review || {};

    safeText(nameEl, emp.name || "—");
    safeText(roleDeptEl, `${role.role_name || "—"} • ${dept.depart_name || "—"}`);
    safeText(emailEl, emp.email || "—");
    safeText(phoneEl, emp.phone || "—");
    safeText(joinedEl, emp.join_date || "—");
    safeText(initialEl, emp.name ? emp.name.charAt(0).toUpperCase() : "—");
    safeText(reviewSummary, review.overall_score ? `Score ${review.overall_score} — ${review.remarks||""}` : "No review");

    // projects
    if(projectsList){
      projectsList.innerHTML = "";
      if(projects.length === 0) projectsList.innerHTML = "<li class='muted'>No projects</li>";
      projects.forEach(p => {
        const li = document.createElement("li");
        li.textContent = `${p.project_name || "Unnamed"} #${p.project_id ?? ""}`;
        projectsList.appendChild(li);
      });
    }

    // attendance
    if(attendanceList){
      attendanceList.innerHTML = "";
      if(attendance.length === 0) attendanceList.innerHTML = "<li class='muted'>No attendance</li>";
      attendance.forEach(a => {
        const li = document.createElement("li");
        li.textContent = `${fmtDate(a.date)} • ${a.status || "-"}`;
        attendanceList.appendChild(li);
      });
    }

    // tasks table
    if(tasksTableBody){
      tasksTableBody.innerHTML = "";
      if(tasks.length === 0){
        const tr = document.createElement("tr");
        tr.innerHTML = `<td colspan="5" style="color:${'#9aa4c0'}">No tasks</td>`;
        tasksTableBody.appendChild(tr);
      } else {
        tasks.forEach(t => {
          const tr = document.createElement("tr");
          tr.innerHTML = `<td>${t.task_id ?? "-"}</td>
                          <td>${t.project_id ?? "-"}</td>
                          <td>${t.score ?? "-"}</td>
                          <td>${t.status ?? "-"}</td>
                          <td>${fmtDate(t.completion_date)}</td>`;
          tasksTableBody.appendChild(tr);
        });
      }
    }

    // stats
    if(taskCount) taskCount.innerText = String(tasks.length);
    const scores = tasks.map(t => (t.score == null ? null : Number(t.score))).filter(s => s !== null);
    const avg = scores.length ? Math.round(scores.reduce((a,b)=>a+b,0)/scores.length) : "—";
    if(avgScore) avgScore.innerText = avg;

    // chart
    if(tasksChartCanvas){
      const ctx = tasksChartCanvas.getContext("2d");
      const labels = tasks.map(t => t.task_id ?? "");
      const dataVals = tasks.map(t => (t.score == null ? 0 : Number(t.score)));
      if(chartInstance) chartInstance.destroy();
      chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Score',
            data: dataVals,
            backgroundColor: dataVals.map(v => v >= 85 ? 'rgba(6,182,212,0.9)' : 'rgba(124,58,237,0.85)'),
            borderRadius: 6
          }]
        },
        options:{
          responsive:true,
          plugins:{legend:{display:false}},
          scales:{ y:{beginAtZero:true, suggestedMax:100} },
          animation:{duration:600}
        }
      });
    }
  }

  // PDF Download Function
  async function downloadPDF() {
    if (!currentProfileData) {
      alert("No profile data to export");
      return;
    }

    setStatus("Generating PDF...", "#ffb86b");
    
    try {
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const emp = currentProfileData.employee || {};
      const role = currentProfileData.role || {};
      const dept = currentProfileData.department || {};
      const tasks = Array.isArray(currentProfileData.tasks) ? currentProfileData.tasks : [];
      const attendance = Array.isArray(currentProfileData.attendance) ? currentProfileData.attendance : [];
      const projects = Array.isArray(currentProfileData.projects) ? currentProfileData.projects : [];
      const review = currentProfileData.performance_review || {};
      
      // Title
      pdf.setFontSize(20);
      pdf.setTextColor(0, 229, 255);
      pdf.text("EMPLOYEE PERFORMANCE REPORT", 105, 20, { align: "center" });
      
      // Employee Info
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      let yPos = 40;
      
      pdf.setFont(undefined, 'bold');
      pdf.text(`Name: ${emp.name || "—"}`, 20, yPos);
      yPos += 8;
      
      pdf.setFont(undefined, 'normal');
      pdf.text(`Role: ${role.role_name || "—"}`, 20, yPos);
      pdf.text(`Department: ${dept.depart_name || "—"}`, 110, yPos);
      yPos += 8;
      
      pdf.text(`Email: ${emp.email || "—"}`, 20, yPos);
      yPos += 8;
      
      pdf.text(`Phone: ${emp.phone || "—"}`, 20, yPos);
      pdf.text(`Joined: ${emp.join_date || "—"}`, 110, yPos);
      yPos += 12;
      
      // Performance Stats
      pdf.setFont(undefined, 'bold');
      pdf.setFontSize(14);
      pdf.text("Performance Statistics", 20, yPos);
      yPos += 8;
      
      pdf.setFontSize(11);
      pdf.setFont(undefined, 'normal');
      const scores = tasks.map(t => (t.score == null ? null : Number(t.score))).filter(s => s !== null);
      const avgScoreVal = scores.length ? Math.round(scores.reduce((a,b)=>a+b,0)/scores.length) : 0;
      
      pdf.text(`Total Tasks: ${tasks.length}`, 20, yPos);
      pdf.text(`Average Score: ${avgScoreVal}`, 110, yPos);
      yPos += 8;
      
      if (review.overall_score) {
        pdf.text(`Review Score: ${review.overall_score}`, 20, yPos);
        yPos += 6;
        if (review.remarks) {
          pdf.text(`Remarks: ${review.remarks}`, 20, yPos);
          yPos += 8;
        }
      }
      yPos += 6;
      
      // Projects
      pdf.setFont(undefined, 'bold');
      pdf.setFontSize(14);
      pdf.text("Projects", 20, yPos);
      yPos += 8;
      
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      if (projects.length === 0) {
        pdf.text("No projects assigned", 20, yPos);
        yPos += 8;
      } else {
        projects.forEach((p, idx) => {
          if (yPos > 270) {
            pdf.addPage();
            yPos = 20;
          }
          pdf.text(`${idx + 1}. ${p.project_name || "Unnamed"} (ID: ${p.project_id ?? "-"})`, 20, yPos);
          yPos += 6;
        });
      }
      yPos += 6;
      
      // Tasks Table
      if (yPos > 240) {
        pdf.addPage();
        yPos = 20;
      }
      
      pdf.setFont(undefined, 'bold');
      pdf.setFontSize(14);
      pdf.text("Task Details", 20, yPos);
      yPos += 8;
      
      pdf.setFontSize(9);
      pdf.setFont(undefined, 'bold');
      pdf.text("ID", 20, yPos);
      pdf.text("Project", 40, yPos);
      pdf.text("Score", 80, yPos);
      pdf.text("Status", 110, yPos);
      pdf.text("Date", 150, yPos);
      yPos += 6;
      
      pdf.setFont(undefined, 'normal');
      if (tasks.length === 0) {
        pdf.text("No tasks found", 20, yPos);
      } else {
        tasks.forEach(t => {
          if (yPos > 280) {
            pdf.addPage();
            yPos = 20;
          }
          pdf.text(String(t.task_id ?? "-"), 20, yPos);
          pdf.text(String(t.project_id ?? "-"), 40, yPos);
          pdf.text(String(t.score ?? "-"), 80, yPos);
          pdf.text(String(t.status ?? "-"), 110, yPos);
          pdf.text(fmtDate(t.completion_date), 150, yPos);
          yPos += 6;
        });
      }
      
      // Save PDF
      const fileName = `Employee_Report_${emp.name || "Unknown"}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      setStatus("PDF Downloaded!", "#00ff88");
      setTimeout(() => setStatus("Loaded"), 2000);
      
    } catch (error) {
      console.error("PDF generation error:", error);
      setStatus("PDF Error", "#ff6b6b");
      alert("Failed to generate PDF. Please try again.");
      setTimeout(() => setStatus("Loaded"), 2000);
    }
  }

  // events
  if(fetchBtn) fetchBtn.addEventListener("click", ()=> {
    const id = $("employeeId")?.value;
    fetchProfile(id);
  });
  if(clearBtn) clearBtn.addEventListener("click", clearUI);
  if(downloadPdfBtn) downloadPdfBtn.addEventListener("click", downloadPDF);
  
  const empInput = $("employeeId");
  if(empInput) empInput.addEventListener("keydown", ev => { if(ev.key === "Enter") fetchBtn.click(); });
});