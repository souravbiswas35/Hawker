import { useState, useEffect } from "react";
import { FiCalendar, FiPlus, FiClock, FiCheck, FiAlertTriangle, FiFilter, FiSearch, FiMapPin, FiUser, FiFileText, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import AdminLayout from "../../components/layout/AdminLayout";
import PageTitle from "../../components/common/PageTitle";
import api from "../../api/client";
import "../../styles/pages/admin/AdminCompliancePage.css";

export default function AdminCompliancePage() {
  const [metrics, setMetrics] = useState({ todayInspections: 0, completed: 0, upcoming: 0, violations: 0 });
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [viewType, setViewType] = useState("month");
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [historyFilters, setHistoryFilters] = useState({ date: "", inspectorId: "", zone: "", outcome: "" });
  const [inspectionHistory, setInspectionHistory] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [inspectors, setInspectors] = useState([]);
  const [scheduleForm, setScheduleForm] = useState({
    vendorId: "",
    inspectorId: "",
    scheduledDate: "",
    templateId: "",
    type: "routine",
  });

  useEffect(() => {
    loadDashboardMetrics();
    loadCalendarEvents();
    loadTodaySchedule();
    loadTemplates();
    loadInspectors();
    setLoading(false);
  }, [viewType, currentMonth]);

  const loadDashboardMetrics = async () => {
    try {
      const res = await api.get("/admin/inspections/dashboard-metrics");
      setMetrics(res.data);
    } catch (err) {
      console.error("Failed to load metrics:", err);
    }
  };

  const loadCalendarEvents = async () => {
    try {
      const res = await api.get(`/admin/inspections/calendar-events?viewType=${viewType}`);
      setCalendarEvents(res.data.events || []);
    } catch (err) {
      console.error("Failed to load calendar events:", err);
    }
  };

  const loadTodaySchedule = async () => {
    try {
      const res = await api.get("/admin/inspections/today-schedule");
      setTodaySchedule(res.data.schedule || []);
    } catch (err) {
      console.error("Failed to load today's schedule:", err);
    }
  };

  const loadTemplates = async () => {
    try {
      const res = await api.get("/admin/inspections/templates");
      setTemplates(res.data.templates || []);
    } catch (err) {
      console.error("Failed to load templates:", err);
    }
  };

  const loadInspectors = async () => {
    try {
      const res = await api.get("/admin/inspections/inspectors");
      setInspectors(res.data.inspectors || []);
    } catch (err) {
      console.error("Failed to load inspectors:", err);
    }
  };

  const loadHistory = async () => {
    try {
      const res = await api.get("/admin/inspections/history", { params: historyFilters });
      setInspectionHistory(res.data.inspections || []);
    } catch (err) {
      console.error("Failed to load history:", err);
    }
  };

  const handleScheduleInspection = async (e) => {
    e.preventDefault();
    try {
      await api.post("/admin/inspections/schedule", scheduleForm);
      alert("Inspection scheduled successfully!");
      setShowScheduleModal(false);
      loadTodaySchedule();
      loadCalendarEvents();
      loadDashboardMetrics();
    } catch (err) {
      console.error("Failed to schedule inspection:", err);
      alert("Failed to schedule inspection. Please try again.");
    }
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const getEventCountForDate = (date) => {
    const event = calendarEvents.find(e => e.date === date);
    return event ? event.count : 0;
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const monthName = currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const eventCount = getEventCountForDate(dateStr);
      const isToday = new Date().toISOString().split("T")[0] === dateStr;

      days.push(
        <div key={day} className={`calendar-day ${isToday ? "today" : ""}`}>
          <span className="day-number">{day}</span>
          {eventCount > 0 && (
            <span className={`event-badge ${eventCount > 1 ? "multi-event" : ""}`}>
              {eventCount} insp.
            </span>
          )}
        </div>
      );
    }

    return (
      <div className="calendar-container">
        <div className="calendar-header">
          <button className="calendar-nav" onClick={handlePreviousMonth}>
            <FiChevronLeft />
          </button>
          <h3 className="calendar-title">{monthName}</h3>
          <button className="calendar-nav" onClick={handleNextMonth}>
            <FiChevronRight />
          </button>
        </div>
        <div className="calendar-weekdays">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="calendar-weekday">{day}</div>
          ))}
        </div>
        <div className="calendar-grid">{days}</div>
      </div>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "status-completed";
      case "in_progress":
        return "status-in-progress";
      case "scheduled":
        return "status-scheduled";
      default:
        return "status-default";
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="compliance-loading">Loading compliance dashboard...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <PageTitle
        title="Inspection & Compliance"
        subtitle="Schedule and monitor field inspections"
        icon={FiFileText}
      />

      <div className="compliance-container">
        {/* Schedule Button */}
        <button className="schedule-new-btn" onClick={() => setShowScheduleModal(true)}>
          <FiPlus />
          Schedule New Inspection
        </button>

        {/* KPI Metrics Ribbon */}
        <div className="metrics-ribbon">
          <div className="metric-block">
            <div className="metric-icon metric-icon-blue">
              <FiCalendar />
            </div>
            <div className="metric-info">
              <div className="metric-label">Today's Inspections</div>
              <div className="metric-value">{metrics.todayInspections}</div>
            </div>
          </div>
          <div className="metric-block">
            <div className="metric-icon metric-icon-green">
              <FiCheck />
            </div>
            <div className="metric-info">
              <div className="metric-label">Completed</div>
              <div className="metric-value">{metrics.completed}</div>
            </div>
          </div>
          <div className="metric-block">
            <div className="metric-icon metric-icon-cyan">
              <FiClock />
            </div>
            <div className="metric-info">
              <div className="metric-label">Upcoming</div>
              <div className="metric-value">{metrics.upcoming}</div>
            </div>
          </div>
          <div className="metric-block">
            <div className="metric-icon metric-icon-orange">
              <FiAlertTriangle />
            </div>
            <div className="metric-info">
              <div className="metric-label">Violations Found</div>
              <div className="metric-value">{metrics.violations}</div>
            </div>
          </div>
        </div>

        <div className="compliance-grid">
          {/* Calendar Panel */}
          <div className="calendar-panel">
            <div className="panel-header">
              <h3>Inspection Calendar</h3>
              <div className="view-toggle">
                <button
                  className={`view-btn ${viewType === "today" ? "active" : ""}`}
                  onClick={() => setViewType("today")}
                >
                  Today
                </button>
                <button
                  className={`view-btn ${viewType === "week" ? "active" : ""}`}
                  onClick={() => setViewType("week")}
                >
                  Week
                </button>
                <button
                  className={`view-btn ${viewType === "month" ? "active" : ""}`}
                  onClick={() => setViewType("month")}
                >
                  Month
                </button>
              </div>
            </div>
            <div className="calendar-wrapper">{renderCalendar()}</div>
          </div>

          {/* Today's Schedule Panel */}
          <div className="schedule-panel">
            <div className="panel-header">
              <h3>Today's Schedule</h3>
            </div>
            <div className="schedule-list">
              {todaySchedule.length === 0 ? (
                <div className="no-schedule">
                  <FiCalendar />
                  <p>No inspections scheduled for today</p>
                </div>
              ) : (
                todaySchedule.map((item) => (
                  <div key={item.id} className="schedule-item">
                    <div className="schedule-time">
                      <FiClock />
                      {formatTime(item.scheduled_date)}
                    </div>
                    <div className="schedule-details">
                      <div className="schedule-vendor">{item.business_name || `${item.first_name} ${item.last_name}`}</div>
                      <div className="schedule-zone">
                        <FiMapPin />
                        {item.zone_name || "Not assigned"}
                      </div>
                      <div className="schedule-inspector">
                        <FiUser />
                        {item.inspector_name || "Not assigned"}
                      </div>
                    </div>
                    <div className={`schedule-status ${getStatusColor(item.status)}`}>
                      {item.status.replace(/_/g, " ").toUpperCase()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* History Section */}
        <div className="history-section">
          <div className="history-header">
            <h3>Inspection History</h3>
            <div className="history-filters">
              <div className="filter-group">
                <FiSearch />
                <input
                  type="date"
                  value={historyFilters.date}
                  onChange={(e) => setHistoryFilters({ ...historyFilters, date: e.target.value })}
                  placeholder="Date"
                />
              </div>
              <select
                value={historyFilters.inspectorId}
                onChange={(e) => setHistoryFilters({ ...historyFilters, inspectorId: e.target.value })}
              >
                <option value="">All Inspectors</option>
                {inspectors.map((inspector) => (
                  <option key={inspector.id} value={inspector.id}>
                    {inspector.name}
                  </option>
                ))}
              </select>
              <select
                value={historyFilters.outcome}
                onChange={(e) => setHistoryFilters({ ...historyFilters, outcome: e.target.value })}
              >
                <option value="">All Outcomes</option>
                <option value="passed">Passed</option>
                <option value="minor_issues">Minor Issues</option>
                <option value="warnings">Warnings</option>
                <option value="failed">Failed</option>
              </select>
              <button className="filter-btn" onClick={loadHistory}>
                <FiFilter />
                Apply Filters
              </button>
            </div>
          </div>
          <div className="history-list">
            {inspectionHistory.length === 0 ? (
              <div className="no-history">
                <FiFileText />
                <p>No inspection history found</p>
              </div>
            ) : (
              inspectionHistory.map((item) => (
                <div key={item.id} className="history-item">
                  <div className="history-date">{formatDate(item.scheduled_date)}</div>
                  <div className="history-vendor">{item.business_name}</div>
                  <div className="history-zone">{item.zone_name}</div>
                  <div className="history-inspector">{item.inspector_name}</div>
                  <div className={`history-outcome ${getStatusColor(item.outcome)}`}>
                    {item.outcome.replace(/_/g, " ").toUpperCase()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="modal-overlay" onClick={() => setShowScheduleModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Schedule New Inspection</h3>
              <button className="modal-close" onClick={() => setShowScheduleModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleScheduleInspection} className="modal-body">
              <div className="form-group">
                <label>Vendor ID</label>
                <input
                  type="text"
                  value={scheduleForm.vendorId}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, vendorId: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Inspector</label>
                <select
                  value={scheduleForm.inspectorId}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, inspectorId: e.target.value })}
                  required
                >
                  <option value="">Select Inspector</option>
                  {inspectors.map((inspector) => (
                    <option key={inspector.id} value={inspector.id}>
                      {inspector.name} - {inspector.rank}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Date & Time</label>
                <input
                  type="datetime-local"
                  value={scheduleForm.scheduledDate}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, scheduledDate: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Template</label>
                <select
                  value={scheduleForm.templateId}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, templateId: e.target.value })}
                >
                  <option value="">Select Template</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Type</label>
                <select
                  value={scheduleForm.type}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, type: e.target.value })}
                >
                  <option value="routine">Routine</option>
                  <option value="license_verification">License Verification</option>
                  <option value="initial_setup">Initial Setup</option>
                  <option value="complaint">Complaint</option>
                  <option value="follow_up">Follow-up</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowScheduleModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Schedule Inspection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
