const $ = id => document.getElementById(id);
let all = [], questions = [], index = 0, subject = "Physics";
let attempted = 0, correct = 0, locked = false;
const answered = new Set();
const bookmarks = new Set();
const key = q => String(q.question_id ?? q.id ?? q.question);
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function correctIndex(q) {
  const v = q.correct_option;
  if (v == null || v === "") return -1;
  const s = String(v).trim().toUpperCase();
  if (/^[A-D]$/.test(s)) return s.charCodeAt(0) - 65;
  if (/^[1-4]$/.test(s)) return Number(s) - 1;
  if (/^[0-3]$/.test(s)) return Number(s);
  return -1;
}
function optionsOf(q) {
  return [q.option_1,q.option_2,q.option_3,q.option_4].filter(v => v != null && String(v).trim());
}
function setupFilters() {
  const panel = $("progress").parentElement;
  const controls = document.createElement("div");
  controls.id = "pyqFilters";
  controls.innerHTML = '<input id="topicSearch" placeholder="Search question or topic" style="width:100%;padding:12px;margin:10px 0;border-radius:10px"><select id="difficulty" style="padding:10px;margin:4px"><option value="">All difficulty</option><option>Easy</option><option>Medium</option><option>Hard</option></select><select id="topic" style="padding:10px;margin:4px"><option value="">All topics</option></select><button id="bookmarkFilter" class="action secondary">★ Bookmarks</button>';
  panel.insertBefore(controls, $("progress"));
  const style = document.createElement("style");
  style.textContent = '#pyqFilters input,#pyqFilters select{max-width:100%;background:#151a27;color:inherit;border:1px solid #394258}#qmeta{margin:10px 0;color:#aab5cc;font-size:13px}#qimages img,#simages img{max-width:100%;height:auto;border-radius:10px;margin:8px 0}#solution{white-space:pre-wrap;line-height:1.6;margin-top:12px}';
  document.head.append(style);
  $("topicSearch").addEventListener("input", filterQuestions);
  $("difficulty").addEventListener("change", filterQuestions);
  $("topic").addEventListener("change", filterQuestions);
  $("bookmarkFilter").addEventListener("click", () => {
    $("bookmarkFilter").dataset.on = $("bookmarkFilter").dataset.on === "1" ? "0" : "1";
    filterQuestions();
  });
}
function filterQuestions() {
  const search = $("topicSearch").value.toLowerCase().trim();
  const diff = $("difficulty").value.toLowerCase();
  const topic = $("topic").value;
  const onlySaved = $("bookmarkFilter").dataset.on === "1";
  questions = all.filter(q => {
    const t = String(q.topic || "Unclassified");
    const text = [q.question,t,q.subtopic,q.source_paper].join(" ").toLowerCase();
    const d = String(q.difficulty || "").toLowerCase();
    return q.subject === subject && (!diff || d === diff) && (!topic || t === topic) && (!search || text.includes(search)) && (!onlySaved || bookmarks.has(key(q)));
  });
  index = 0;
  render();
}
function fillTopics() {
  const values = [...new Set(all.filter(q => q.subject === subject).map(q => q.topic || "Unclassified"))].sort();
  $("topic").innerHTML = '<option value="">All topics</option>' + values.map(t => '<option value="'+esc(t)+'">'+esc(t)+'</option>').join("");
}
function showImages(id, paths) {
  const node = $(id);
  node.replaceChildren();
  (paths || []).forEach(src => {
    const img = document.createElement("img");
    img.src = src;
    img.alt = "Question illustration";
    img.loading = "lazy";
    img.onerror = () => img.remove();
    node.append(img);
  });
}
function render() {
  const q = questions[index];
  locked = false;
  if (!q) {
    $("progress").textContent = subject.toUpperCase() + " · NO MATCHING QUESTIONS";
    $("question").textContent = "No questions match these filters. Try changing the topic, difficulty, or search.";
    $("options").replaceChildren();
    $("feedback").textContent = "";
    return;
  }
  $("progress").textContent = subject.toUpperCase()+" · QUESTION "+(index+1)+" / "+questions.length;
  $("question").textContent = q.question || "Question text unavailable";
  $("feedback").textContent = "";
  $("options").replaceChildren();
  document.querySelectorAll("#qmeta,#qimages,#simages,#solution,#showSolution,#saveQuestion").forEach(n=>n.remove());
  const meta = document.createElement("div");
  meta.id = "qmeta";
  meta.textContent = "Topic: "+(q.topic || "Unclassified")+" · "+(q.difficulty || "Difficulty not labelled")+" · "+(q.source_paper || q.exam || "Source paper not specified");
  $("question").after(meta);
  const qi = document.createElement("div"); qi.id="qimages"; meta.after(qi);
  showImages("qimages",q.question_images);
  const opts = optionsOf(q);
  opts.forEach((answer,i)=>{
    const b=document.createElement("button");
    b.className="option";
    b.textContent=String.fromCharCode(65+i)+". "+answer;
    b.addEventListener("click",()=>choose(i));
    $("options").append(b);
  });
  const saved=document.createElement("button");
  saved.id="saveQuestion"; saved.className="action secondary";
  saved.textContent=bookmarks.has(key(q))?"★ Saved":"☆ Bookmark";
  saved.onclick=()=>{bookmarks.has(key(q))?bookmarks.delete(key(q)):bookmarks.add(key(q));saved.textContent=bookmarks.has(key(q))?"★ Saved":"☆ Bookmark";};
  $("options").after(saved);
  const show=document.createElement("button");
  show.id="showSolution"; show.className="action secondary";
  show.textContent="Show solution";
  saved.after(show);
  const sol=document.createElement("div"); sol.id="solution"; show.after(sol); sol.style.whiteSpace="pre-wrap"; sol.style.lineHeight="1.65";
  const si=document.createElement("div"); si.id="simages"; sol.after(si);
      show.onclick=()=>{const raw=q.solution || (q.numerical_answer != null && q.numerical_answer !== "" ? "Numerical answer: "+q.numerical_answer : "No solution is provided in the source for this question."); sol.textContent=String(raw).replace(/\[IMAGE\]/g,"\n[Image or diagram reference]\n").replace(/\\n/g,"\n").trim(); showImages("simages",q.solution_images);};
  if (q.answer_available === false) $("feedback").textContent="Answer missing in source: practice only; not scored.";
  $("next").textContent=index===questions.length-1?"Restart filtered set 🔄":"Next question ➡️";
}
function choose(i) {
  if (locked) return;
  const q=questions[index]; if(!q)return;
  const opts=optionsOf(q), answer=correctIndex(q);
  if(answer<0) {
    locked=true;
    $("feedback").textContent="Answer key unavailable or not a valid A-D option. This question will not affect your score. Check Show solution.";
    return;
  }
  locked=true;
  const firstAttempt=!answered.has(key(q));
  if(firstAttempt){attempted++;answered.add(key(q));}
  const ok=i===answer;
  if(firstAttempt && ok)correct++;
  [...$("options").children].forEach((b,n)=>{
    b.disabled=true;
    if(n===answer)b.classList.add("correct");
    if(n===i&&!ok)b.classList.add("wrong");
  });
  $("feedback").textContent=answer<0?"Source provides a numerical answer; use Show solution to review it.":(ok?"✓ Correct! ":"✗ Incorrect. ")+(q.solution || "Use Show solution for details.");
  $("total").textContent=attempted;
  $("score").textContent=correct;
  $("percent").textContent=attempted?Math.round(correct/attempted*100)+"%":"0%";
}
document.querySelectorAll(".sub").forEach(b=>b.addEventListener("click",()=>{
  subject=b.dataset.sub==="Maths"?"Mathematics":b.dataset.sub;
  index=0;
  document.querySelectorAll(".sub").forEach(x=>x.classList.toggle("active",x===b));
  fillTopics();
  filterQuestions();
}));
$("next").addEventListener("click",()=>{if(index>=questions.length-1)index=0;else index++;render();});
$("restart").addEventListener("click",()=>{index=0;render();});
async function start() {
  setupFilters();
  $("question").textContent="Loading real JEE questions…";
  try {
    const response=await fetch("data/questions.json");
    if(!response.ok)throw Error("HTTP "+response.status);
    all=await response.json();
    $("total").textContent="0";$("score").textContent="0";$("percent").textContent="0%";
    fillTopics();filterQuestions();
    const note=document.querySelector("main > .small");
    if(note)note.textContent="Source dataset: 2,307 questions. Some answers and difficulty labels are missing; see data/SOURCES.md for attribution.";
    console.log("PYQ_DATA_OK",all.length);
  } catch(e) {
    $("question").textContent="Could not load data/questions.json. Open the site through the Codespaces web preview, not a local file.";
    $("feedback").textContent=String(e);
    console.error(e);
  }
}
start();
