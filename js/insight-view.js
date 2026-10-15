/* js/insight-view.js — Strengths & Weaknesses Diagnostic Engine */
const Insights = {
  analyze(studentId) {
    const rawData = window.DB ? window.DB.d : null;
    if (!rawData) return { strengths: [], weaknesses: [], subjectMap: {} };

    const student = rawData.users.find(u => u.id === studentId);
    const targetClass = student ? student.class : "JSS 1";

    const progressKey = `eduahead-progress-v1:${studentId}`;
    let progress = { completed: [], scores: {}, studied: [] };
    try {
      progress = JSON.parse(localStorage.getItem(progressKey)) || progress;
    } catch (e) {}

    const strengths = [];
    const weaknesses = [];
    const subjectMap = {};

    rawData.subjects.forEach(sub => {
      const classTopics = sub.topics.filter(t => t.level === targetClass);
      if (!classTopics.length) return;

      let totalScore = 0;
      let count = 0;
      const topicSummaries = [];

      classTopics.forEach(topic => {
        const key = `${topic.level}::${sub.id}::${topic.title}`;
        const score = progress.scores[key];

        if (score !== undefined) {
          totalScore += score;
          count++;
          if (score >= 70) {
            strengths.push({ subject: sub.name, topic: topic.title, score });
            topicSummaries.push({ title: topic.title, status: `${score}% Score`, score, type: "strong" });
          } else {
            weaknesses.push({ subject: sub.name, topic: topic.title, score, unattempted: false });
            topicSummaries.push({ title: topic.title, status: score < 50 ? `Failed: ${score}%` : `Needs attention: ${score}%`, score, type: score < 50 ? "failed" : "weak" });
          }
        } else {
          weaknesses.push({ subject: sub.name, topic: topic.title, score: 0, unattempted: true });
          topicSummaries.push({ title: topic.title, status: "Not attempted", score: null, type: "missing" });
        }
      });

      const avg = count > 0 ? Math.round(totalScore / count) : null;
      subjectMap[sub.id] = { name: sub.name, icon: sub.icon, avg, topics: topicSummaries };
    });

    return { strengths, weaknesses, subjectMap };
  },

  render(studentId) {
    const { strengths, weaknesses, subjectMap } = this.analyze(studentId);

    const strengthsHtml = strengths.length
      ? strengths.map(s => `<div class="topic-row"><div class="topic-number" style="background:var(--green-pale);color:var(--green)">✓</div><div class="topic-info"><strong>${s.topic}</strong><small>${s.subject}</small></div><span class="status completed">${s.score}% Mastery</span></div>`).join("")
      : `<p class="muted">Complete practice quizzes to generate your strengths profile.</p>`;

    const weaknessesHtml = weaknesses.length
      ? weaknesses.slice(0, 5).map(w => `<div class="topic-row"><div class="topic-number" style="background:var(--orange-pale);color:var(--orange)">⚡</div><div class="topic-info"><strong>${w.topic}</strong><small>${w.subject} · ${w.unattempted ? 'Not attempted' : w.score + '%'}</small></div><span class="status upcoming">Focus Area</span></div>`).join("")
      : `<p class="muted">Excellent performance! No critical knowledge gaps identified.</p>`;

    const subjectCards = Object.values(subjectMap).map(sub => {
      const weakTopics = sub.topics.filter(t => t.type === "failed" || t.type === "weak" || t.type === "missing");
      const breakdown = weakTopics.length
        ? weakTopics.map(t => `<div class="topic-row"><div class="topic-info"><strong>${t.title}</strong></div><small class="${t.type === 'failed' ? 'text-danger' : t.type === 'missing' ? 'text-warning' : 'text-orange'}">${t.status}</small></div>`).join("")
        : `<div class="topic-row"><div class="topic-info"><strong>No major weak areas</strong></div><small>Strong performance in this subject.</small></div>`;

      return `
        <div class="panel" style="margin-bottom:16px">
          <div class="panel-heading">
            <h2>${sub.icon} ${sub.name}</h2>
            <span class="status ${sub.avg >= 70 ? 'completed' : sub.avg >= 50 ? 'ahead' : 'upcoming'}">
              ${sub.avg !== null ? `Average: ${sub.avg}%` : 'No Quiz Data'}
            </span>
          </div>
          <div class="topic-list">
            <div class="section-head" style="margin:0 0 10px"><h3 style="font-size:12px">Parts to revisit</h3></div>
            ${breakdown}
          </div>
        </div>
      `;
    }).join("");

    return `
      <div class="page-header">
        <div>
          <div class="eyebrow">DIAGNOSTIC ANALYTICS</div>
          <h1>My Specific Strengths and Weaknesses</h1>
          <p>Real-time competency tracking derived from your coursework and quizzes.</p>
        </div>
      </div>
      <div class="two-col" style="margin-bottom:24px">
        <div class="panel"><div class="panel-heading"><h2>🚀 Key Strengths</h2></div><div class="topic-list">${strengthsHtml}</div></div>
        <div class="panel"><div class="panel-heading"><h2>🎯 Target Revision Areas</h2></div><div class="topic-list">${weaknessesHtml}</div></div>
      </div>
      <div class="section-head"><h2>Subject Mastery Breakdown</h2></div>
      ${subjectCards}
    `;
  }
};

window.Insights = Insights;