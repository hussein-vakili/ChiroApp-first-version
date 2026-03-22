const { useDeferredValue, useEffect, useMemo, useState } = React;

const startTransitionSafe = React.startTransition
  ? React.startTransition
  : (callback) => callback();

const STORAGE_KEY = "chiroapp-integrated-demo-v2";
const DEMO_TODAY = "2026-03-22";
const DEMO_TOMORROW = "2026-03-23";
const roleOrder = ["patient", "practitioner", "adminFrontDesk", "manager"];

const integrationCatalog = {
  websiteBooking: {
    name: "Website Booking",
    lane: "Online Booking",
    description:
      "Online booking requests stay synchronized with the live clinic calendar so staff and practitioners always work from the same schedule.",
  },
  stripe: {
    name: "Stripe",
    lane: "Payment Processing",
    description:
      "Card and wallet payments flow through Stripe for one-off visit charges and front-desk checkout.",
  },
  goCardless: {
    name: "GoCardless",
    lane: "Membership Plans",
    description:
      "Recurring packages and memberships use GoCardless to automate collection and plan status tracking.",
  },
  messaging: {
    name: "SMS/Email Service",
    lane: "Automated Communications",
    description:
      "Appointment reminders, recalls, and broader clinic communications are delivered through the messaging service.",
  },
};

const roleConfig = {
  patient: {
    label: "Patient",
    kicker: "Booking, forms, and reminders",
    summary:
      "Patients can book, reschedule, complete forms, check in, and manage how reminders reach them.",
    modules: [
      {
        id: "bookAppointment",
        title: "Book Appointment",
        badge: "Booking",
        service: "websiteBooking",
      },
      {
        id: "rescheduleAppointment",
        title: "Reschedule / Cancel",
        badge: "Calendar",
        service: "websiteBooking",
      },
      {
        id: "completeForms",
        title: "Complete Forms",
        badge: "Intake",
      },
      {
        id: "checkIn",
        title: "Check In",
        badge: "Arrival",
      },
      {
        id: "receiveReminders",
        title: "Receive Reminders",
        badge: "Messaging",
        service: "messaging",
      },
    ],
  },
  practitioner: {
    label: "Practitioner",
    kicker: "Clinical schedule and documentation",
    summary:
      "Practitioners move from the live schedule into patient context and clinical notes without leaving the shared record.",
    modules: [
      {
        id: "viewSchedule",
        title: "View Schedule",
        badge: "Schedule",
      },
      {
        id: "writeClinicalNotes",
        title: "Write Clinical Notes",
        badge: "Documentation",
      },
      {
        id: "viewPatientHistory",
        title: "View Patient History",
        badge: "History",
      },
    ],
  },
  adminFrontDesk: {
    label: "Admin / Front Desk",
    kicker: "Operations, billing, and outreach",
    summary:
      "Front desk controls the calendar, takes payments, manages memberships, triggers recalls, and keeps communications moving.",
    modules: [
      {
        id: "manageCalendar",
        title: "Manage Calendar",
        badge: "Operations",
        service: "websiteBooking",
      },
      {
        id: "takePayments",
        title: "Take Payments",
        badge: "Billing",
        service: "stripe",
      },
      {
        id: "manageMemberships",
        title: "Packages / Memberships",
        badge: "Recurring",
        service: "goCardless",
      },
      {
        id: "triggerRecalls",
        title: "Trigger Recalls",
        badge: "Retention",
        service: "messaging",
      },
      {
        id: "manageCommunications",
        title: "Manage Communications",
        badge: "Comms",
        service: "messaging",
      },
    ],
  },
  manager: {
    label: "Manager",
    kicker: "Visibility, reporting, and automation",
    summary:
      "Managers see clinic performance, run reports, and tune the automation rules that drive reminders and recalls.",
    modules: [
      {
        id: "viewDashboard",
        title: "View Dashboard",
        badge: "KPI",
      },
      {
        id: "runReports",
        title: "Run Reports",
        badge: "Reports",
      },
      {
        id: "configureAutomation",
        title: "Configure Automation",
        badge: "Automation",
        service: "messaging",
      },
    ],
  },
};

const initialClinicData = {
  patients: [
    {
      id: "PT-1001",
      name: "Amina Karim",
      practitioner: "Dr. Chen",
      formsStatus: "Complete",
      balance: 85,
      preferredChannel: "SMS",
      lastVisit: "2026-03-12",
      recallStatus: "Current",
      source: "Website Booking",
    },
    {
      id: "PT-1002",
      name: "Miles Carter",
      practitioner: "Dr. Patel",
      formsStatus: "Pending",
      balance: 140,
      preferredChannel: "Email",
      lastVisit: "2025-12-18",
      recallStatus: "Due",
      source: "Manual import",
    },
    {
      id: "PT-1003",
      name: "Noah Hart",
      practitioner: "Dr. Alvarez",
      formsStatus: "Complete",
      balance: 0,
      preferredChannel: "SMS",
      lastVisit: "2026-03-18",
      recallStatus: "Current",
      source: "Website Booking",
    },
    {
      id: "PT-1004",
      name: "Elena Brooks",
      practitioner: "Dr. Chen",
      formsStatus: "Complete",
      balance: 40,
      preferredChannel: "Email",
      lastVisit: "2025-11-21",
      recallStatus: "Renewal Due",
      source: "Referral",
    },
  ],
  appointments: [
    {
      id: "APT-2048",
      patientId: "PT-1001",
      patientName: "Amina Karim",
      practitioner: "Dr. Chen",
      date: "2026-03-28",
      time: "10:30",
      type: "Follow-up",
      status: "Booked",
      source: "Website Booking",
    },
    {
      id: "APT-2051",
      patientId: "PT-1002",
      patientName: "Miles Carter",
      practitioner: "Dr. Patel",
      date: "2026-03-22",
      time: "09:00",
      type: "New patient",
      status: "Needs Forms",
      source: "Website Booking",
    },
    {
      id: "APT-2058",
      patientId: "PT-1003",
      patientName: "Noah Hart",
      practitioner: "Dr. Alvarez",
      date: "2026-03-20",
      time: "14:00",
      type: "Wellness visit",
      status: "Checked In",
      source: "Manual",
    },
    {
      id: "APT-2062",
      patientId: "PT-1004",
      patientName: "Elena Brooks",
      practitioner: "Dr. Chen",
      date: "2026-03-25",
      time: "16:15",
      type: "Membership visit",
      status: "Booked",
      source: "Website Booking",
    },
  ],
  notes: [
    {
      id: "NOTE-1001",
      patientId: "PT-1001",
      patientName: "Amina Karim",
      practitioner: "Dr. Chen",
      date: "2026-03-12",
      summary: "Improved cervical rotation after adjustment and soft tissue work.",
    },
    {
      id: "NOTE-1002",
      patientId: "PT-1003",
      patientName: "Noah Hart",
      practitioner: "Dr. Alvarez",
      date: "2026-03-18",
      summary: "Lumbar stiffness reduced. Home mobility program reinforced.",
    },
    {
      id: "NOTE-1003",
      patientId: "PT-1004",
      patientName: "Elena Brooks",
      practitioner: "Dr. Chen",
      date: "2025-11-21",
      summary: "Maintenance visit completed with strong response to thoracic mobilization.",
    },
  ],
  payments: [
    {
      id: "PAY-1001",
      patientId: "PT-1003",
      patientName: "Noah Hart",
      amount: 95,
      method: "Card",
      provider: "Stripe",
      status: "Succeeded",
      date: "2026-03-22",
    },
    {
      id: "PAY-1002",
      patientId: "PT-1001",
      patientName: "Amina Karim",
      amount: 60,
      method: "Apple Pay",
      provider: "Stripe",
      status: "Succeeded",
      date: "2026-03-18",
    },
  ],
  memberships: [
    {
      id: "MEM-301",
      patientId: "PT-1004",
      patientName: "Elena Brooks",
      plan: "Recovery Plus",
      price: 120,
      provider: "GoCardless",
      status: "Active",
      renewalDate: "2026-03-27",
    },
    {
      id: "MEM-302",
      patientId: "PT-1001",
      patientName: "Amina Karim",
      plan: "Wellness Monthly",
      price: 85,
      provider: "GoCardless",
      status: "Active",
      renewalDate: "2026-04-02",
    },
  ],
  communications: [
    {
      id: "MSG-1001",
      patientId: "PT-1002",
      patientName: "Miles Carter",
      type: "Form Reminder",
      channel: "Email",
      provider: "SMS/Email Service",
      status: "Sent",
      audience: "Patient",
      date: "2026-03-22",
    },
    {
      id: "MSG-1002",
      patientId: "PT-1004",
      patientName: "Elena Brooks",
      type: "Recall",
      channel: "SMS",
      provider: "SMS/Email Service",
      status: "Queued",
      audience: "Patient",
      date: "2026-03-22",
    },
    {
      id: "MSG-1003",
      patientId: null,
      patientName: "Tomorrow's Patients",
      type: "Appointment Reminder",
      channel: "SMS",
      provider: "SMS/Email Service",
      status: "Sent",
      audience: "Cohort",
      date: "2026-03-19",
    },
  ],
  automations: [
    {
      id: "AUTO-201",
      name: "24h Appointment Reminder",
      triggerWindow: "24 hours before visit",
      strategy: "SMS first, email fallback after 12 hours",
      status: "Active",
    },
    {
      id: "AUTO-202",
      name: "30-Day Recall",
      triggerWindow: "30 days after last completed visit",
      strategy: "Email recall with booking link",
      status: "Active",
    },
  ],
  calendarBlocks: [
    {
      id: "BLK-701",
      practitioner: "Dr. Chen",
      date: "2026-03-21",
      window: "14:00-15:00",
      type: "Blocked Time",
      note: "Team training",
    },
    {
      id: "BLK-702",
      practitioner: "Dr. Patel",
      date: "2026-03-23",
      window: "08:30-09:00",
      type: "Open Extra Slots",
      note: "Early access for new patients",
    },
  ],
  reports: [
    {
      id: "REP-401",
      title: "Weekly Bookings Snapshot",
      format: "Dashboard",
      timeframe: "Last 7 days",
      requestedAt: "2026-03-22",
      summary: "41 bookings, 92% fill rate, and 3 active recall campaigns.",
    },
  ],
  integrationEvents: [
    {
      id: "SYNC-901",
      service: "Website Booking",
      status: "Healthy",
      detail: "3 online bookings synchronized into the live calendar today.",
      stamp: "Mar 22, 09:12",
    },
    {
      id: "SYNC-902",
      service: "Stripe",
      status: "Healthy",
      detail: "2 payments settled successfully for yesterday's checkout batch.",
      stamp: "Mar 22, 08:40",
    },
    {
      id: "SYNC-903",
      service: "GoCardless",
      status: "Healthy",
      detail: "Membership renewals prepared for the upcoming weekly debit run.",
      stamp: "Mar 22, 08:05",
    },
    {
      id: "SYNC-904",
      service: "SMS/Email Service",
      status: "Healthy",
      detail: "Reminder automation sent 14 messages with 98% delivery success.",
      stamp: "Mar 22, 07:45",
    },
  ],
  activity: [
    {
      id: "ACT-801",
      role: "patient",
      title: "Website booking synced",
      detail: "Amina Karim booked a follow-up with Dr. Chen for March 28.",
      stamp: "Mar 22, 09:12",
    },
    {
      id: "ACT-802",
      role: "practitioner",
      title: "Schedule opened",
      detail: "Dr. Alvarez loaded today's room list with one patient checked in.",
      stamp: "Mar 22, 08:58",
    },
    {
      id: "ACT-803",
      role: "adminFrontDesk",
      title: "Recall cohort prepared",
      detail: "Two overdue patients are queued for outreach.",
      stamp: "Mar 22, 08:36",
    },
    {
      id: "ACT-804",
      role: "manager",
      title: "Dashboard refreshed",
      detail: "Daily revenue and membership metrics were recalculated.",
      stamp: "Mar 22, 08:12",
    },
  ],
};

function cloneInitialData() {
  return JSON.parse(JSON.stringify(initialClinicData));
}

function loadClinicData() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return cloneInitialData();
    }

    const parsed = JSON.parse(raw);

    if (!parsed || !Array.isArray(parsed.patients) || !Array.isArray(parsed.appointments)) {
      return cloneInitialData();
    }

    return parsed;
  } catch (error) {
    return cloneInitialData();
  }
}

function makeStamp() {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

function createId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function formatMoney(amount) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));
}

function lowerIncludes(value, search) {
  return String(value || "").toLowerCase().includes(search.toLowerCase());
}

function findPatient(clinic, patientId) {
  return clinic.patients.find((patient) => patient.id === patientId) || null;
}

function getPatientAppointments(clinic, patientId) {
  return clinic.appointments
    .filter((appointment) => appointment.patientId === patientId)
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
}

function getPatientNotes(clinic, patientId) {
  return clinic.notes
    .filter((note) => note.patientId === patientId)
    .sort((a, b) => b.date.localeCompare(a.date));
}

function getPatientPayments(clinic, patientId) {
  return clinic.payments
    .filter((payment) => payment.patientId === patientId)
    .sort((a, b) => b.date.localeCompare(a.date));
}

function getPatientMembership(clinic, patientId) {
  return (
    clinic.memberships.find(
      (membership) =>
        membership.patientId === patientId && membership.status !== "Cancelled"
    ) || null
  );
}

function getNextVisit(clinic, patientId) {
  const upcoming = clinic.appointments
    .filter(
      (appointment) =>
        appointment.patientId === patientId && appointment.status !== "Cancelled"
    )
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));

  return upcoming[0] || null;
}

function appendActivity(activity, entry) {
  return [
    {
      id: createId("ACT"),
      stamp: makeStamp(),
      ...entry,
    },
    ...activity,
  ].slice(0, 14);
}

function appendIntegrationEvent(events, entry) {
  return [
    {
      id: createId("SYNC"),
      stamp: makeStamp(),
      ...entry,
    },
    ...events,
  ].slice(0, 12);
}

function statusTone(value) {
  const normalized = String(value || "").toLowerCase();

  if (
    normalized.includes("healthy") ||
    normalized.includes("booked") ||
    normalized.includes("complete") ||
    normalized.includes("checked in") ||
    normalized.includes("sent") ||
    normalized.includes("succeeded") ||
    normalized.includes("active") ||
    normalized.includes("current")
  ) {
    return "success";
  }

  if (
    normalized.includes("pending") ||
    normalized.includes("queued") ||
    normalized.includes("needs") ||
    normalized.includes("draft") ||
    normalized.includes("renewal")
  ) {
    return "warning";
  }

  if (
    normalized.includes("cancel") ||
    normalized.includes("overdue") ||
    normalized.includes("due")
  ) {
    return "danger";
  }

  return "neutral";
}

function optionLabel(option) {
  return typeof option === "string" ? option : option.label;
}

function optionValue(option) {
  return typeof option === "string" ? option : option.value;
}

function buildServiceMetrics(clinic) {
  const sentMessages = clinic.communications.filter(
    (communication) => communication.status === "Sent"
  ).length;
  const activeMemberships = clinic.memberships.filter(
    (membership) => membership.status === "Active"
  ).length;
  const successfulPayments = clinic.payments.filter(
    (payment) => payment.status === "Succeeded"
  );
  const websiteBookings = clinic.appointments.filter(
    (appointment) => appointment.source === "Website Booking"
  ).length;

  return {
    websiteBooking: {
      label: `${websiteBookings} synced appointments`,
      detail: "Online bookings and calendar changes are moving through one live schedule.",
    },
    stripe: {
      label: `${successfulPayments.length} successful payments`,
      detail: `${formatMoney(
        successfulPayments.reduce((total, payment) => total + payment.amount, 0)
      )} settled across visit checkout.`,
    },
    goCardless: {
      label: `${activeMemberships} active memberships`,
      detail: "Recurring plans are connected to package and membership operations.",
    },
    messaging: {
      label: `${sentMessages} sent messages`,
      detail: "Reminders, recalls, and communication campaigns share one messaging rail.",
    },
  };
}

function buildOverviewStats(clinic) {
  const upcomingAppointments = clinic.appointments.filter(
    (appointment) => appointment.status !== "Cancelled"
  ).length;
  const checkedInNow = clinic.appointments.filter(
    (appointment) => appointment.status === "Checked In"
  ).length;
  const outstandingBalance = clinic.patients.reduce(
    (total, patient) => total + patient.balance,
    0
  );
  const queuedMessages = clinic.communications.filter((communication) =>
    ["Queued", "Draft"].includes(communication.status)
  ).length;

  return [
    {
      value: clinic.patients.length,
      label: "Active patients",
      caption: "Shared across booking, notes, billing, and messaging",
    },
    {
      value: upcomingAppointments,
      label: "Open appointments",
      caption: `${checkedInNow} currently checked in`,
    },
    {
      value: formatMoney(outstandingBalance),
      label: "Outstanding balance",
      caption: "Visible to front desk and management",
    },
    {
      value: queuedMessages,
      label: "Queued communications",
      caption: "Reminders, recalls, and outreach campaigns",
    },
  ];
}

function StatusChip({ value }) {
  return <span className={`status-chip is-${statusTone(value)}`}>{value}</span>;
}

function Hero({ clinic }) {
  const stats = buildOverviewStats(clinic);

  return (
    <header className="card hero">
      <div className="hero__copy">
        <p className="eyebrow">Integrated Clinic App</p>
        <h1>One React app for booking, care delivery, billing, messaging, and reporting.</h1>
        <p className="hero__summary">
          This prototype links patient actions, practitioner workflow, front-desk
          operations, management reporting, and external systems into one shared
          clinic operating surface.
        </p>
        <div className="hero__actions">
          <a className="button button--primary" href="#command-center">
            Open Command Center
          </a>
          <a className="button button--ghost" href="docs/use-cases.md">
            View Use-Case Spec
          </a>
        </div>
      </div>

      <div className="hero__status">
        <StatCard value={stats[0].value} label={stats[0].label} />
        <StatCard value={stats[1].value} label={stats[1].label} />
        <StatCard value={stats[2].value} label={stats[2].label} />
        <StatCard value="4" label="Connected systems" />
      </div>

      <div className="actor-strip">
        {roleOrder.map((roleId) => (
          <span className="actor-pill" key={roleId}>
            {roleConfig[roleId].label}
          </span>
        ))}
      </div>
    </header>
  );
}

function StatCard({ value, label }) {
  return (
    <div className="hero__stat">
      <span className="hero__stat-value">{value}</span>
      <span className="hero__stat-label">{label}</span>
    </div>
  );
}

function OverviewBar({ clinic }) {
  const stats = buildOverviewStats(clinic);

  return (
    <section className="card insight-bar">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Live Overview</p>
          <h2>Shared operational state across every role.</h2>
        </div>
        <p className="section-copy">
          The numbers below update from the same patient, appointment, payment,
          communication, and automation records used throughout the app.
        </p>
      </div>

      <div className="overview-grid">
        {stats.map((stat) => (
          <article className="overview-card" key={stat.label}>
            <span className="overview-card__value">{stat.value}</span>
            <span className="overview-card__label">{stat.label}</span>
            <p>{stat.caption}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function RoleSwitcher({ activeRole, onChange }) {
  return (
    <div className="role-switcher">
      {roleOrder.map((roleId) => {
        const role = roleConfig[roleId];
        const isActive = roleId === activeRole;

        return (
          <button
            className={`role-button${isActive ? " is-active" : ""}`}
            key={roleId}
            onClick={() => onChange(roleId)}
            type="button"
          >
            <span className="role-button__title">{role.label}</span>
            <span className="role-button__caption">{role.kicker}</span>
          </button>
        );
      })}
    </div>
  );
}

function ModuleTabs({ modules, activeModule, onChange }) {
  return (
    <div className="module-tabs">
      {modules.map((module) => {
        const isActive = module.id === activeModule;

        return (
          <button
            className={`module-tab${isActive ? " is-active" : ""}`}
            key={module.id}
            onClick={() => onChange(module.id)}
            type="button"
          >
            <span className="module-tab__badge">{module.badge}</span>
            <span className="module-tab__title">{module.title}</span>
          </button>
        );
      })}
    </div>
  );
}

function FieldRenderer({ field }) {
  if (field.type === "select") {
    return (
      <div className="field">
        <label htmlFor={field.name}>{field.label}</label>
        <select
          defaultValue={
            field.defaultValue !== undefined
              ? field.defaultValue
              : optionValue(field.options[0])
          }
          id={field.name}
          name={field.name}
        >
          {field.options.map((option) => (
            <option key={optionValue(option)} value={optionValue(option)}>
              {optionLabel(option)}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (field.type === "textarea") {
    return (
      <div className="field">
        <label htmlFor={field.name}>{field.label}</label>
        <textarea
          defaultValue={field.defaultValue || ""}
          id={field.name}
          name={field.name}
          placeholder={field.placeholder || ""}
        />
      </div>
    );
  }

  return (
    <div className="field">
      <label htmlFor={field.name}>{field.label}</label>
      <input
        defaultValue={field.defaultValue || ""}
        id={field.name}
        name={field.name}
        placeholder={field.placeholder || ""}
        type={field.type}
      />
    </div>
  );
}

function SmartForm({ fields, onSubmit, submitLabel }) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const values = {};

        fields.forEach((field) => {
          values[field.name] = formData.get(field.name);
        });

        onSubmit(values);
        event.currentTarget.reset();
      }}
    >
      <div className={`form-grid${fields.length > 3 ? " form-grid--two" : ""}`}>
        {fields.map((field) => (
          <FieldRenderer field={field} key={field.name} />
        ))}
      </div>
      <div className="form-actions">
        <button className="button button--primary" type="submit">
          {submitLabel}
        </button>
        <button className="button button--ghost" type="reset">
          Reset
        </button>
      </div>
    </form>
  );
}

function DataList({ items, emptyLabel, renderItem, title }) {
  return (
    <div className="detail-panel">
      <div className="detail-panel__header">
        <h3>{title}</h3>
      </div>
      {items.length === 0 ? (
        <div className="empty-state">{emptyLabel}</div>
      ) : (
        <ul className="stack-list">
          {items.map((item, index) => (
            <li key={item.id || `${title}-${index}`}>{renderItem(item)}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DataTable({ columns, emptyLabel, rows, title }) {
  return (
    <div className="table-card">
      <div className="console-card__header">
        <h3>{title}</h3>
      </div>
      {rows.length === 0 ? (
        <div className="empty-state">{emptyLabel}</div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column.key}>{column.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  {columns.map((column) => (
                    <td key={column.key}>
                      {column.render ? column.render(row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function InsightTiles({ items, title }) {
  return (
    <div className="detail-panel">
      <div className="detail-panel__header">
        <h3>{title}</h3>
      </div>
      <div className="mini-stats">
        {items.map((item) => (
          <div className="mini-stat" key={item.label}>
            <span className="mini-stat__value">{item.value}</span>
            <span className="mini-stat__label">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FocusPatientCard({ clinic, patient }) {
  const nextVisit = patient ? getNextVisit(clinic, patient.id) : null;
  const membership = patient ? getPatientMembership(clinic, patient.id) : null;
  const notes = patient ? getPatientNotes(clinic, patient.id).slice(0, 2) : [];

  if (!patient) {
    return null;
  }

  return (
    <section className="console-card">
      <div className="console-card__header">
        <h3>Focus Patient</h3>
        <span className="console-card__status">{patient.id}</span>
      </div>

      <div className="patient-focus__hero">
        <div>
          <strong>{patient.name}</strong>
          <p>{patient.practitioner}</p>
        </div>
        <StatusChip value={patient.formsStatus} />
      </div>

      <div className="summary-grid">
        <div className="summary-tile">
          <span className="summary-tile__label">Next visit</span>
          <strong>{nextVisit ? `${nextVisit.date} ${nextVisit.time}` : "None scheduled"}</strong>
        </div>
        <div className="summary-tile">
          <span className="summary-tile__label">Balance</span>
          <strong>{formatMoney(patient.balance)}</strong>
        </div>
        <div className="summary-tile">
          <span className="summary-tile__label">Membership</span>
          <strong>{membership ? membership.plan : "No active plan"}</strong>
        </div>
        <div className="summary-tile">
          <span className="summary-tile__label">Recall status</span>
          <strong>{patient.recallStatus}</strong>
        </div>
      </div>

      <div className="stack-caption">Recent clinical notes</div>
      <ul className="stack-list stack-list--compact">
        {notes.length === 0 ? (
          <li>
            <span className="stack-list__meta">No recent notes for this patient yet.</span>
          </li>
        ) : (
          notes.map((note) => (
            <li key={note.id}>
              <strong>{note.date}</strong>
              <span className="stack-list__meta">{note.summary}</span>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}

function IntegrationPulse({ clinic }) {
  const metrics = buildServiceMetrics(clinic);

  return (
    <section className="console-card">
      <div className="console-card__header">
        <h3>Integration Pulse</h3>
        <span className="console-card__status">Live sync</span>
      </div>

      <div className="integration-mini-grid">
        {Object.keys(integrationCatalog).map((key) => {
          const service = integrationCatalog[key];
          const metric = metrics[key];

          return (
            <article className="integration-mini" key={key}>
              <div className="integration-mini__header">
                <strong>{service.name}</strong>
                <StatusChip value="Healthy" />
              </div>
              <span className="integration-mini__metric">{metric.label}</span>
              <p>{service.lane}</p>
            </article>
          );
        })}
      </div>

      <div className="stack-caption">Recent sync events</div>
      <ul className="stack-list stack-list--compact">
        {clinic.integrationEvents.slice(0, 4).map((event) => (
          <li key={event.id}>
            <strong>{event.service}</strong>
            <span className="stack-list__meta">
              {event.detail} • {event.stamp}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ActivityFeed({ clinic }) {
  return (
    <section className="console-card">
      <div className="console-card__header">
        <h3>Recent Activity</h3>
        <span className="console-card__status">Shared log</span>
      </div>
      <ul className="activity-log">
        {clinic.activity.slice(0, 6).map((entry) => (
          <li key={entry.id}>
            <span className="activity-log__title">{entry.title}</span>
            <span className="activity-log__meta">
              {entry.detail} • {entry.stamp}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ModuleIntro({ module, role }) {
  const integration = module.service ? integrationCatalog[module.service] : null;

  return (
    <div className="module-intro">
      <div className="module-intro__meta">
        <span className="use-case-card__badge">{module.badge}</span>
        {integration ? (
          <span className="module-intro__service">{integration.name}</span>
        ) : null}
      </div>
      <h3>{module.title}</h3>
      <p>{role.summary}</p>
    </div>
  );
}

function PatientWorkspace({
  clinic,
  focusPatient,
  moduleId,
  onBookAppointment,
  onRescheduleAppointment,
  onCompleteForms,
  onCheckIn,
  onSaveReminder,
}) {
  const upcomingAppointments = focusPatient
    ? getPatientAppointments(clinic, focusPatient.id).filter(
        (appointment) => appointment.status !== "Cancelled"
      )
    : [];
  const recentMessages = focusPatient
    ? clinic.communications
        .filter((communication) => communication.patientId === focusPatient.id)
        .slice(0, 4)
    : [];

  if (moduleId === "bookAppointment") {
    const fields = [
      {
        name: "patientId",
        label: "Patient",
        type: "select",
        options: clinic.patients.map((patient) => ({
          value: patient.id,
          label: `${patient.name} (${patient.id})`,
        })),
        defaultValue: focusPatient ? focusPatient.id : clinic.patients[0].id,
      },
      {
        name: "practitioner",
        label: "Practitioner",
        type: "select",
        options: ["Dr. Patel", "Dr. Chen", "Dr. Alvarez"],
        defaultValue: focusPatient ? focusPatient.practitioner : "Dr. Chen",
      },
      {
        name: "date",
        label: "Visit date",
        type: "date",
        defaultValue: "2026-03-29",
      },
      {
        name: "time",
        label: "Visit time",
        type: "time",
        defaultValue: "11:00",
      },
      {
        name: "visitType",
        label: "Visit type",
        type: "select",
        options: ["New patient", "Follow-up", "Wellness visit"],
      },
    ];

    return (
      <div className="module-grid">
        <div className="console-card">
          <ModuleIntro module={roleConfig.patient.modules[0]} role={roleConfig.patient} />
          <SmartForm
            fields={fields}
            onSubmit={onBookAppointment}
            submitLabel="Book appointment"
          />
        </div>
        <DataList
          emptyLabel="No upcoming appointments yet."
          items={upcomingAppointments}
          renderItem={(appointment) => (
            <>
              <strong>
                {appointment.date} at {appointment.time}
              </strong>
              <span className="stack-list__meta">
                {appointment.type} with {appointment.practitioner}
              </span>
            </>
          )}
          title="Upcoming visits"
        />
      </div>
    );
  }

  if (moduleId === "rescheduleAppointment") {
    const editableAppointments = clinic.appointments.filter(
      (appointment) => appointment.status !== "Cancelled"
    );

    const fields = [
      {
        name: "appointmentId",
        label: "Appointment",
        type: "select",
        options: editableAppointments.map((appointment) => ({
          value: appointment.id,
          label: `${appointment.id} • ${appointment.patientName} • ${appointment.date} ${appointment.time}`,
        })),
      },
      {
        name: "action",
        label: "Action",
        type: "select",
        options: ["Reschedule", "Cancel"],
      },
      {
        name: "date",
        label: "New date",
        type: "date",
        defaultValue: "2026-03-31",
      },
      {
        name: "time",
        label: "New time",
        type: "time",
        defaultValue: "15:30",
      },
    ];

    return (
      <div className="module-grid">
        <div className="console-card">
          <ModuleIntro module={roleConfig.patient.modules[1]} role={roleConfig.patient} />
          <SmartForm
            fields={fields}
            onSubmit={onRescheduleAppointment}
            submitLabel="Save calendar change"
          />
        </div>
        <DataTable
          columns={[
            { key: "id", label: "ID" },
            { key: "patientName", label: "Patient" },
            {
              key: "slot",
              label: "Slot",
              render: (row) => `${row.date} ${row.time}`,
            },
            {
              key: "status",
              label: "Status",
              render: (row) => <StatusChip value={row.status} />,
            },
          ]}
          emptyLabel="No editable appointments found."
          rows={editableAppointments.slice(0, 6)}
          title="Appointment queue"
        />
      </div>
    );
  }

  if (moduleId === "completeForms") {
    const fields = [
      {
        name: "patientId",
        label: "Patient",
        type: "select",
        options: clinic.patients.map((patient) => ({
          value: patient.id,
          label: `${patient.name} (${patient.formsStatus})`,
        })),
        defaultValue: focusPatient ? focusPatient.id : clinic.patients[0].id,
      },
      {
        name: "formType",
        label: "Form set",
        type: "select",
        options: ["New patient intake", "Consent update", "Insurance details"],
      },
      {
        name: "notes",
        label: "Patient note",
        type: "textarea",
        placeholder: "No recent injuries. Main concern is lower back stiffness.",
      },
    ];

    return (
      <div className="module-grid">
        <div className="console-card">
          <ModuleIntro module={roleConfig.patient.modules[2]} role={roleConfig.patient} />
          <SmartForm fields={fields} onSubmit={onCompleteForms} submitLabel="Mark forms complete" />
        </div>
        <DataTable
          columns={[
            { key: "name", label: "Patient" },
            {
              key: "formsStatus",
              label: "Forms",
              render: (row) => <StatusChip value={row.formsStatus} />,
            },
            { key: "practitioner", label: "Practitioner" },
            { key: "preferredChannel", label: "Channel" },
          ]}
          emptyLabel="No patients available."
          rows={clinic.patients}
          title="Intake readiness"
        />
      </div>
    );
  }

  if (moduleId === "checkIn") {
    const fields = [
      {
        name: "appointmentId",
        label: "Appointment",
        type: "select",
        options: clinic.appointments
          .filter((appointment) => appointment.status !== "Cancelled")
          .map((appointment) => ({
            value: appointment.id,
            label: `${appointment.patientName} • ${appointment.date} ${appointment.time}`,
          })),
      },
      {
        name: "arrivalTime",
        label: "Arrival time",
        type: "time",
        defaultValue: "09:10",
      },
      {
        name: "arrivalNote",
        label: "Arrival note",
        type: "textarea",
        placeholder: "Patient is on site and ready.",
      },
    ];

    const arrivals = clinic.appointments.filter((appointment) =>
      ["Checked In", "Needs Forms", "Booked"].includes(appointment.status)
    );

    return (
      <div className="module-grid">
        <div className="console-card">
          <ModuleIntro module={roleConfig.patient.modules[3]} role={roleConfig.patient} />
          <SmartForm fields={fields} onSubmit={onCheckIn} submitLabel="Confirm check in" />
        </div>
        <DataTable
          columns={[
            { key: "patientName", label: "Patient" },
            {
              key: "slot",
              label: "Slot",
              render: (row) => `${row.date} ${row.time}`,
            },
            { key: "practitioner", label: "Practitioner" },
            {
              key: "status",
              label: "Status",
              render: (row) => <StatusChip value={row.status} />,
            },
          ]}
          emptyLabel="No arrivals to show."
          rows={arrivals.slice(0, 6)}
          title="Arrival board"
        />
      </div>
    );
  }

  const fields = [
    {
      name: "patientId",
      label: "Patient",
      type: "select",
      options: clinic.patients.map((patient) => ({
        value: patient.id,
        label: `${patient.name} (${patient.preferredChannel})`,
      })),
      defaultValue: focusPatient ? focusPatient.id : clinic.patients[0].id,
    },
    {
      name: "channel",
      label: "Preferred channel",
      type: "select",
      options: ["SMS", "Email"],
      defaultValue: focusPatient ? focusPatient.preferredChannel : "SMS",
    },
    {
      name: "type",
      label: "Reminder type",
      type: "select",
      options: ["Appointment Reminder", "Form Reminder", "Follow-up Reminder"],
    },
    {
      name: "message",
      label: "Message preview",
      type: "textarea",
      placeholder: "Reminder: your chiropractic appointment is tomorrow at 10:30 AM.",
    },
  ];

  return (
    <div className="module-grid">
      <div className="console-card">
        <ModuleIntro module={roleConfig.patient.modules[4]} role={roleConfig.patient} />
        <SmartForm fields={fields} onSubmit={onSaveReminder} submitLabel="Save reminder setup" />
      </div>
      <DataList
        emptyLabel="No reminders recorded for this patient yet."
        items={recentMessages}
        renderItem={(message) => (
          <>
            <div className="list-row">
              <strong>{message.type}</strong>
              <StatusChip value={message.status} />
            </div>
            <span className="stack-list__meta">
              {message.channel} • {message.date}
            </span>
          </>
        )}
        title="Reminder history"
      />
    </div>
  );
}

function PractitionerWorkspace({
  clinic,
  focusPatient,
  moduleId,
  onWriteClinicalNote,
}) {
  if (moduleId === "viewSchedule") {
    const todayAppointments = clinic.appointments
      .filter((appointment) => appointment.status !== "Cancelled")
      .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));

    return (
      <div className="workspace-stack">
        <InsightTiles
          items={[
            {
              label: "Visits today",
              value: clinic.appointments.filter((appointment) => appointment.date === DEMO_TODAY).length,
            },
            {
              label: "Checked in",
              value: clinic.appointments.filter((appointment) => appointment.status === "Checked In").length,
            },
            {
              label: "Needs forms",
              value: clinic.appointments.filter((appointment) => appointment.status === "Needs Forms").length,
            },
          ]}
          title="Schedule snapshot"
        />
        <DataTable
          columns={[
            {
              key: "slot",
              label: "Slot",
              render: (row) => `${row.date} ${row.time}`,
            },
            { key: "patientName", label: "Patient" },
            { key: "practitioner", label: "Practitioner" },
            { key: "type", label: "Visit type" },
            {
              key: "status",
              label: "Status",
              render: (row) => <StatusChip value={row.status} />,
            },
          ]}
          emptyLabel="No appointments on the schedule."
          rows={todayAppointments}
          title="Live practitioner schedule"
        />
      </div>
    );
  }

  if (moduleId === "writeClinicalNotes") {
    const fields = [
      {
        name: "appointmentId",
        label: "Appointment",
        type: "select",
        options: clinic.appointments
          .filter((appointment) => appointment.status !== "Cancelled")
          .map((appointment) => ({
            value: appointment.id,
            label: `${appointment.patientName} • ${appointment.practitioner} • ${appointment.date}`,
          })),
      },
      {
        name: "note",
        label: "Clinical note",
        type: "textarea",
        placeholder: "Improved lumbar flexion. Performed adjustment and reinforced home mobility plan.",
      },
      {
        name: "plan",
        label: "Next step",
        type: "select",
        options: ["Discharge", "1-week follow-up", "2-week follow-up", "Membership review"],
      },
    ];

    return (
      <div className="module-grid">
        <div className="console-card">
          <ModuleIntro
            module={roleConfig.practitioner.modules[1]}
            role={roleConfig.practitioner}
          />
          <SmartForm
            fields={fields}
            onSubmit={onWriteClinicalNote}
            submitLabel="Save clinical note"
          />
        </div>
        <DataList
          emptyLabel="No recent notes available."
          items={clinic.notes.slice(0, 5)}
          renderItem={(note) => (
            <>
              <div className="list-row">
                <strong>{note.patientName}</strong>
                <span className="stack-list__meta">{note.date}</span>
              </div>
              <span className="stack-list__meta">{note.summary}</span>
            </>
          )}
          title="Recent clinical notes"
        />
      </div>
    );
  }

  const historyAppointments = focusPatient
    ? getPatientAppointments(clinic, focusPatient.id).slice(0, 5)
    : [];
  const historyNotes = focusPatient ? getPatientNotes(clinic, focusPatient.id).slice(0, 3) : [];
  const historyPayments = focusPatient ? getPatientPayments(clinic, focusPatient.id).slice(0, 3) : [];

  return (
    <div className="workspace-stack">
      <div className="history-grid">
        <DataList
          emptyLabel="No appointment history yet."
          items={historyAppointments}
          renderItem={(appointment) => (
            <>
              <div className="list-row">
                <strong>{appointment.date}</strong>
                <StatusChip value={appointment.status} />
              </div>
              <span className="stack-list__meta">
                {appointment.type} with {appointment.practitioner}
              </span>
            </>
          )}
          title="Appointment history"
        />
        <DataList
          emptyLabel="No clinical notes yet."
          items={historyNotes}
          renderItem={(note) => (
            <>
              <strong>{note.date}</strong>
              <span className="stack-list__meta">{note.summary}</span>
            </>
          )}
          title="Clinical note history"
        />
        <DataList
          emptyLabel="No payment history yet."
          items={historyPayments}
          renderItem={(payment) => (
            <>
              <div className="list-row">
                <strong>{formatMoney(payment.amount)}</strong>
                <StatusChip value={payment.status} />
              </div>
              <span className="stack-list__meta">
                {payment.method} • {payment.date}
              </span>
            </>
          )}
          title="Financial history"
        />
      </div>
    </div>
  );
}

function AdminWorkspace({
  clinic,
  focusPatient,
  moduleId,
  onManageCalendar,
  onTakePayment,
  onManageMembership,
  onTriggerRecall,
  onManageCommunication,
}) {
  if (moduleId === "manageCalendar") {
    const fields = [
      {
        name: "practitioner",
        label: "Practitioner",
        type: "select",
        options: ["Dr. Patel", "Dr. Chen", "Dr. Alvarez"],
      },
      {
        name: "type",
        label: "Calendar action",
        type: "select",
        options: ["Blocked Time", "Open Extra Slots", "Room Hold"],
      },
      {
        name: "date",
        label: "Date",
        type: "date",
        defaultValue: "2026-03-24",
      },
      {
        name: "window",
        label: "Window",
        type: "text",
        placeholder: "13:00-14:00",
      },
      {
        name: "note",
        label: "Ops note",
        type: "textarea",
        placeholder: "Block this hour for team training.",
      },
    ];

    return (
      <div className="module-grid">
        <div className="console-card">
          <ModuleIntro
            module={roleConfig.adminFrontDesk.modules[0]}
            role={roleConfig.adminFrontDesk}
          />
          <SmartForm fields={fields} onSubmit={onManageCalendar} submitLabel="Update calendar" />
        </div>
        <DataTable
          columns={[
            { key: "practitioner", label: "Practitioner" },
            { key: "date", label: "Date" },
            { key: "window", label: "Window" },
            {
              key: "type",
              label: "Type",
              render: (row) => <StatusChip value={row.type} />,
            },
          ]}
          emptyLabel="No calendar changes yet."
          rows={clinic.calendarBlocks.slice(0, 6)}
          title="Calendar controls"
        />
      </div>
    );
  }

  if (moduleId === "takePayments") {
    const fields = [
      {
        name: "patientId",
        label: "Patient",
        type: "select",
        options: clinic.patients.map((patient) => ({
          value: patient.id,
          label: `${patient.name} • ${formatMoney(patient.balance)} due`,
        })),
        defaultValue: focusPatient ? focusPatient.id : clinic.patients[0].id,
      },
      {
        name: "amount",
        label: "Amount",
        type: "number",
        defaultValue: focusPatient ? focusPatient.balance || 0 : 85,
      },
      {
        name: "method",
        label: "Payment method",
        type: "select",
        options: ["Card", "Apple Pay", "Cash", "Manual terminal"],
      },
    ];

    return (
      <div className="module-grid">
        <div className="console-card">
          <ModuleIntro
            module={roleConfig.adminFrontDesk.modules[1]}
            role={roleConfig.adminFrontDesk}
          />
          <SmartForm fields={fields} onSubmit={onTakePayment} submitLabel="Take payment" />
        </div>
        <DataTable
          columns={[
            { key: "patientName", label: "Patient" },
            {
              key: "amount",
              label: "Amount",
              render: (row) => formatMoney(row.amount),
            },
            { key: "method", label: "Method" },
            {
              key: "status",
              label: "Status",
              render: (row) => <StatusChip value={row.status} />,
            },
          ]}
          emptyLabel="No payment records yet."
          rows={clinic.payments.slice(0, 6)}
          title="Payment ledger"
        />
      </div>
    );
  }

  if (moduleId === "manageMemberships") {
    const fields = [
      {
        name: "patientId",
        label: "Patient",
        type: "select",
        options: clinic.patients.map((patient) => ({
          value: patient.id,
          label: `${patient.name} (${patient.id})`,
        })),
        defaultValue: focusPatient ? focusPatient.id : clinic.patients[0].id,
      },
      {
        name: "plan",
        label: "Plan",
        type: "select",
        options: ["Wellness Monthly", "Recovery Plus", "6-Visit Package", "12-Visit Package"],
      },
      {
        name: "price",
        label: "Price",
        type: "number",
        defaultValue: 85,
      },
      {
        name: "renewalDate",
        label: "Renewal date",
        type: "date",
        defaultValue: "2026-04-05",
      },
    ];

    return (
      <div className="module-grid">
        <div className="console-card">
          <ModuleIntro
            module={roleConfig.adminFrontDesk.modules[2]}
            role={roleConfig.adminFrontDesk}
          />
          <SmartForm
            fields={fields}
            onSubmit={onManageMembership}
            submitLabel="Save membership"
          />
        </div>
        <DataTable
          columns={[
            { key: "patientName", label: "Patient" },
            { key: "plan", label: "Plan" },
            {
              key: "price",
              label: "Price",
              render: (row) => formatMoney(row.price),
            },
            {
              key: "status",
              label: "Status",
              render: (row) => <StatusChip value={row.status} />,
            },
          ]}
          emptyLabel="No memberships available."
          rows={clinic.memberships.slice(0, 6)}
          title="Membership plans"
        />
      </div>
    );
  }

  if (moduleId === "triggerRecalls") {
    const fields = [
      {
        name: "segment",
        label: "Segment",
        type: "select",
        options: ["Due", "Renewal Due", "All overdue"],
      },
      {
        name: "channel",
        label: "Channel",
        type: "select",
        options: ["SMS", "Email"],
      },
      {
        name: "message",
        label: "Recall message",
        type: "textarea",
        placeholder: "It has been a while since your last visit. Would you like to book your next session?",
      },
    ];

    const recallCandidates = clinic.patients.filter((patient) =>
      ["Due", "Renewal Due"].includes(patient.recallStatus)
    );

    return (
      <div className="module-grid">
        <div className="console-card">
          <ModuleIntro
            module={roleConfig.adminFrontDesk.modules[3]}
            role={roleConfig.adminFrontDesk}
          />
          <SmartForm fields={fields} onSubmit={onTriggerRecall} submitLabel="Trigger recall" />
        </div>
        <DataTable
          columns={[
            { key: "name", label: "Patient" },
            { key: "practitioner", label: "Practitioner" },
            { key: "lastVisit", label: "Last visit" },
            {
              key: "recallStatus",
              label: "Recall",
              render: (row) => <StatusChip value={row.recallStatus} />,
            },
          ]}
          emptyLabel="No recall candidates right now."
          rows={recallCandidates}
          title="Recall candidates"
        />
      </div>
    );
  }

  const fields = [
    {
      name: "audience",
      label: "Audience",
      type: "select",
      options: ["All patients", "Tomorrow's patients", "Membership cohort"],
    },
    {
      name: "channel",
      label: "Channel",
      type: "select",
      options: ["SMS", "Email"],
    },
    {
      name: "template",
      label: "Template",
      type: "select",
      options: ["Appointment reminder", "Clinic update", "Membership renewal"],
    },
    {
      name: "message",
      label: "Message body",
      type: "textarea",
      placeholder: "Clinic update: we have opened new adjustment slots on Friday morning.",
    },
  ];

  return (
    <div className="module-grid">
      <div className="console-card">
        <ModuleIntro
          module={roleConfig.adminFrontDesk.modules[4]}
          role={roleConfig.adminFrontDesk}
        />
        <SmartForm
          fields={fields}
          onSubmit={onManageCommunication}
          submitLabel="Queue communication"
        />
      </div>
      <DataTable
        columns={[
          { key: "patientName", label: "Audience" },
          { key: "type", label: "Type" },
          { key: "channel", label: "Channel" },
          {
            key: "status",
            label: "Status",
            render: (row) => <StatusChip value={row.status} />,
          },
        ]}
        emptyLabel="No communications logged."
        rows={clinic.communications.slice(0, 6)}
        title="Communication queue"
      />
    </div>
  );
}

function ManagerWorkspace({
  clinic,
  moduleId,
  onRunReport,
  onConfigureAutomation,
}) {
  if (moduleId === "viewDashboard") {
    const successfulPaymentsToday = clinic.payments
      .filter((payment) => payment.date === DEMO_TODAY)
      .reduce((total, payment) => total + payment.amount, 0);

    return (
      <div className="workspace-stack">
        <InsightTiles
          items={[
            {
              label: "Revenue today",
              value: formatMoney(successfulPaymentsToday),
            },
            {
              label: "Active memberships",
              value: clinic.memberships.filter((membership) => membership.status === "Active").length,
            },
            {
              label: "Active automations",
              value: clinic.automations.filter((automation) => automation.status === "Active").length,
            },
            {
              label: "Healthy integrations",
              value: clinic.integrationEvents.filter((event) => event.status === "Healthy").length,
            },
          ]}
          title="Manager dashboard"
        />
        <div className="dashboard-grid">
          <DataList
            emptyLabel="No dashboard highlights yet."
            items={clinic.activity.slice(0, 4)}
            renderItem={(item) => (
              <>
                <strong>{item.title}</strong>
                <span className="stack-list__meta">{item.detail}</span>
              </>
            )}
            title="Operational highlights"
          />
          <DataList
            emptyLabel="No automation data yet."
            items={clinic.automations}
            renderItem={(automation) => (
              <>
                <div className="list-row">
                  <strong>{automation.name}</strong>
                  <StatusChip value={automation.status} />
                </div>
                <span className="stack-list__meta">
                  {automation.triggerWindow}
                </span>
              </>
            )}
            title="Automation health"
          />
        </div>
      </div>
    );
  }

  if (moduleId === "runReports") {
    const fields = [
      {
        name: "reportType",
        label: "Report type",
        type: "select",
        options: ["Bookings", "Revenue", "Memberships", "Communications"],
      },
      {
        name: "timeframe",
        label: "Timeframe",
        type: "select",
        options: ["Last 7 days", "Last 30 days", "Quarter to date"],
      },
      {
        name: "format",
        label: "Format",
        type: "select",
        options: ["Dashboard", "CSV", "PDF"],
      },
    ];

    return (
      <div className="module-grid">
        <div className="console-card">
          <ModuleIntro module={roleConfig.manager.modules[1]} role={roleConfig.manager} />
          <SmartForm fields={fields} onSubmit={onRunReport} submitLabel="Generate report" />
        </div>
        <DataList
          emptyLabel="No reports generated yet."
          items={clinic.reports.slice(0, 6)}
          renderItem={(report) => (
            <>
              <div className="list-row">
                <strong>{report.title}</strong>
                <span className="stack-list__meta">{report.format}</span>
              </div>
              <span className="stack-list__meta">
                {report.timeframe} • {report.summary}
              </span>
            </>
          )}
          title="Report history"
        />
      </div>
    );
  }

  const fields = [
    {
      name: "name",
      label: "Automation name",
      type: "select",
      options: [
        "24h Appointment Reminder",
        "30-Day Recall",
        "Membership Renewal Notice",
      ],
    },
    {
      name: "triggerWindow",
      label: "Trigger window",
      type: "select",
      options: [
        "24 hours before visit",
        "30 days after last completed visit",
        "7 days before renewal",
      ],
    },
    {
      name: "strategy",
      label: "Automation note",
      type: "textarea",
      placeholder: "Send SMS first, then email if unread after 12 hours.",
    },
  ];

  return (
    <div className="module-grid">
      <div className="console-card">
        <ModuleIntro module={roleConfig.manager.modules[2]} role={roleConfig.manager} />
        <SmartForm
          fields={fields}
          onSubmit={onConfigureAutomation}
          submitLabel="Save automation rule"
        />
      </div>
      <DataTable
        columns={[
          { key: "name", label: "Automation" },
          { key: "triggerWindow", label: "Trigger" },
          {
            key: "status",
            label: "Status",
            render: (row) => <StatusChip value={row.status} />,
          },
        ]}
        emptyLabel="No automations configured."
        rows={clinic.automations}
        title="Automation rules"
      />
    </div>
  );
}

function WorkspaceRenderer(props) {
  const { activeRole, activeModule } = props;

  if (activeRole === "patient") {
    return <PatientWorkspace {...props} moduleId={activeModule} />;
  }

  if (activeRole === "practitioner") {
    return <PractitionerWorkspace {...props} moduleId={activeModule} />;
  }

  if (activeRole === "adminFrontDesk") {
    return <AdminWorkspace {...props} moduleId={activeModule} />;
  }

  return <ManagerWorkspace {...props} moduleId={activeModule} />;
}

function AppointmentsBoard({ appointments, calendarBlocks }) {
  return (
    <section className="card board-card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Appointments</p>
          <h2>Live schedule and room flow.</h2>
        </div>
        <p className="section-copy">
          Website booking, reschedules, check-ins, and practitioner visibility all
          converge into the same appointment board.
        </p>
      </div>
      <div className="board-grid board-grid--appointments">
        <DataTable
          columns={[
            { key: "patientName", label: "Patient" },
            {
              key: "slot",
              label: "Slot",
              render: (row) => `${row.date} ${row.time}`,
            },
            { key: "practitioner", label: "Practitioner" },
            { key: "source", label: "Source" },
            {
              key: "status",
              label: "Status",
              render: (row) => <StatusChip value={row.status} />,
            },
          ]}
          emptyLabel="No appointments found."
          rows={appointments.slice(0, 8)}
          title="Appointment ledger"
        />
        <DataTable
          columns={[
            { key: "practitioner", label: "Practitioner" },
            { key: "date", label: "Date" },
            { key: "window", label: "Window" },
            {
              key: "type",
              label: "Type",
              render: (row) => <StatusChip value={row.type} />,
            },
          ]}
          emptyLabel="No calendar blocks found."
          rows={calendarBlocks.slice(0, 6)}
          title="Calendar controls"
        />
      </div>
    </section>
  );
}

function FinanceBoard({ memberships, payments }) {
  return (
    <section className="card board-card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Financial Ops</p>
          <h2>Payments and recurring plans.</h2>
        </div>
        <p className="section-copy">
          Stripe handles one-off collections, while GoCardless carries packages
          and memberships through recurring billing.
        </p>
      </div>
      <div className="board-grid">
        <DataTable
          columns={[
            { key: "patientName", label: "Patient" },
            {
              key: "amount",
              label: "Amount",
              render: (row) => formatMoney(row.amount),
            },
            { key: "method", label: "Method" },
            {
              key: "status",
              label: "Status",
              render: (row) => <StatusChip value={row.status} />,
            },
          ]}
          emptyLabel="No payment activity yet."
          rows={payments.slice(0, 6)}
          title="Stripe payment ledger"
        />
        <DataTable
          columns={[
            { key: "patientName", label: "Patient" },
            { key: "plan", label: "Plan" },
            {
              key: "price",
              label: "Price",
              render: (row) => formatMoney(row.price),
            },
            {
              key: "status",
              label: "Status",
              render: (row) => <StatusChip value={row.status} />,
            },
          ]}
          emptyLabel="No membership plans configured."
          rows={memberships.slice(0, 6)}
          title="GoCardless memberships"
        />
      </div>
    </section>
  );
}

function CommunicationBoard({ automations, communications }) {
  return (
    <section className="card board-card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Communications</p>
          <h2>Reminders, recalls, and automation.</h2>
        </div>
        <p className="section-copy">
          The same messaging rail supports patient reminders, front-desk outreach,
          and manager-controlled automation rules.
        </p>
      </div>
      <div className="board-grid">
        <DataTable
          columns={[
            { key: "patientName", label: "Audience" },
            { key: "type", label: "Type" },
            { key: "channel", label: "Channel" },
            {
              key: "status",
              label: "Status",
              render: (row) => <StatusChip value={row.status} />,
            },
          ]}
          emptyLabel="No communications recorded."
          rows={communications.slice(0, 6)}
          title="Messaging queue"
        />
        <DataTable
          columns={[
            { key: "name", label: "Automation" },
            { key: "triggerWindow", label: "Trigger" },
            {
              key: "status",
              label: "Status",
              render: (row) => <StatusChip value={row.status} />,
            },
          ]}
          emptyLabel="No automation rules set."
          rows={automations.slice(0, 6)}
          title="Automation controls"
        />
      </div>
    </section>
  );
}

function RecordsBoard({ clinic, filteredRecords }) {
  return (
    <section className="card board-card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Live Records</p>
          <h2>Search across the shared clinic state.</h2>
        </div>
        <p className="section-copy">
          Filter patients, appointments, communications, notes, and reports from
          one place to confirm the integrated data model is working end to end.
        </p>
      </div>

      <div className="board-grid">
        <DataTable
          columns={[
            { key: "name", label: "Patient" },
            { key: "practitioner", label: "Practitioner" },
            {
              key: "formsStatus",
              label: "Forms",
              render: (row) => <StatusChip value={row.formsStatus} />,
            },
            {
              key: "balance",
              label: "Balance",
              render: (row) => formatMoney(row.balance),
            },
          ]}
          emptyLabel="No patients match the current search."
          rows={filteredRecords.patients.slice(0, 6)}
          title="Patients"
        />
        <DataTable
          columns={[
            { key: "patientName", label: "Patient" },
            { key: "practitioner", label: "Practitioner" },
            { key: "date", label: "Date" },
            {
              key: "status",
              label: "Status",
              render: (row) => <StatusChip value={row.status} />,
            },
          ]}
          emptyLabel="No appointments match the current search."
          rows={filteredRecords.appointments.slice(0, 6)}
          title="Appointments"
        />
        <DataTable
          columns={[
            { key: "patientName", label: "Audience" },
            { key: "type", label: "Type" },
            { key: "channel", label: "Channel" },
            {
              key: "status",
              label: "Status",
              render: (row) => <StatusChip value={row.status} />,
            },
          ]}
          emptyLabel="No messages match the current search."
          rows={filteredRecords.communications.slice(0, 6)}
          title="Communications"
        />
        <DataList
          emptyLabel="No notes or reports match the current search."
          items={[...filteredRecords.notes.slice(0, 3), ...filteredRecords.reports.slice(0, 3)]}
          renderItem={(item) => (
            <>
              <strong>{item.patientName || item.title}</strong>
              <span className="stack-list__meta">
                {item.summary || item.detail || item.timeframe}
              </span>
            </>
          )}
          title="Notes and reports"
        />
      </div>
    </section>
  );
}

function SystemsBoard({ clinic }) {
  const metrics = buildServiceMetrics(clinic);

  return (
    <section className="card platform-map">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Connected Systems</p>
          <h2>External services inside the clinic workflow.</h2>
        </div>
        <p className="section-copy">
          Each external system owns a clear slice of the product while still
          feeding shared operational state back into the clinic app.
        </p>
      </div>
      <div className="platform-grid">
        {Object.keys(integrationCatalog).map((key) => {
          const service = integrationCatalog[key];
          const metric = metrics[key];

          return (
            <article className="platform-tile" key={key}>
              <span className="platform-tile__marker">{service.name}</span>
              <h3>{service.lane}</h3>
              <p>{service.description}</p>
              <div className="service-meta">
                <span className="service-pill">{metric.label}</span>
                <span className="service-pill">Healthy sync</span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function App() {
  const [clinic, setClinic] = useState(loadClinicData);
  const [activeRole, setActiveRole] = useState(roleOrder[0]);
  const [activeModule, setActiveModule] = useState(roleConfig[roleOrder[0]].modules[0].id);
  const [focusPatientId, setFocusPatientId] = useState(initialClinicData.patients[0].id);
  const [recordSearch, setRecordSearch] = useState("");
  const deferredSearch = useDeferredValue(recordSearch);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(clinic));
    } catch (error) {
      // Ignore local storage failures in this prototype.
    }
  }, [clinic]);

  const activeRoleConfig = roleConfig[activeRole];
  const activeModuleConfig =
    activeRoleConfig.modules.find((module) => module.id === activeModule) ||
    activeRoleConfig.modules[0];
  const focusPatient = findPatient(clinic, focusPatientId) || clinic.patients[0] || null;

  const filteredRecords = useMemo(() => {
    if (!deferredSearch.trim()) {
      return {
        patients: clinic.patients,
        appointments: clinic.appointments,
        communications: clinic.communications,
        notes: clinic.notes,
        reports: clinic.reports,
      };
    }

    const search = deferredSearch.trim().toLowerCase();

    return {
      patients: clinic.patients.filter(
        (patient) =>
          lowerIncludes(patient.name, search) ||
          lowerIncludes(patient.id, search) ||
          lowerIncludes(patient.practitioner, search)
      ),
      appointments: clinic.appointments.filter(
        (appointment) =>
          lowerIncludes(appointment.patientName, search) ||
          lowerIncludes(appointment.id, search) ||
          lowerIncludes(appointment.practitioner, search)
      ),
      communications: clinic.communications.filter(
        (communication) =>
          lowerIncludes(communication.patientName, search) ||
          lowerIncludes(communication.type, search) ||
          lowerIncludes(communication.channel, search)
      ),
      notes: clinic.notes.filter(
        (note) =>
          lowerIncludes(note.patientName, search) ||
          lowerIncludes(note.summary, search)
      ),
      reports: clinic.reports.filter(
        (report) =>
          lowerIncludes(report.title, search) ||
          lowerIncludes(report.summary, search)
      ),
    };
  }, [clinic, deferredSearch]);

  function updateClinic(mutator, options) {
    setClinic((previousClinic) => {
      let nextClinic = mutator(previousClinic);

      if (options && options.activity) {
        nextClinic = {
          ...nextClinic,
          activity: appendActivity(nextClinic.activity, options.activity),
        };
      }

      if (options && options.integration) {
        nextClinic = {
          ...nextClinic,
          integrationEvents: appendIntegrationEvent(
            nextClinic.integrationEvents,
            options.integration
          ),
        };
      }

      return nextClinic;
    });
  }

  function handleRoleChange(roleId) {
    startTransitionSafe(() => {
      setActiveRole(roleId);
      setActiveModule(roleConfig[roleId].modules[0].id);
    });
  }

  function handleModuleChange(moduleId) {
    startTransitionSafe(() => {
      setActiveModule(moduleId);
    });
  }

  function handleBookAppointment(values) {
    updateClinic(
      (previousClinic) => {
        const patient = findPatient(previousClinic, values.patientId);

        if (!patient) {
          return previousClinic;
        }

        return {
          ...previousClinic,
          appointments: [
            {
              id: createId("APT"),
              patientId: patient.id,
              patientName: patient.name,
              practitioner: values.practitioner,
              date: values.date,
              time: values.time,
              type: values.visitType,
              status: patient.formsStatus === "Complete" ? "Booked" : "Needs Forms",
              source: "Website Booking",
            },
            ...previousClinic.appointments,
          ],
        };
      },
      {
        activity: {
          role: "patient",
          title: "Appointment booked",
          detail: `${findPatient(clinic, values.patientId)?.name || "Patient"} booked ${values.visitType} on ${values.date} at ${values.time}.`,
        },
        integration: {
          service: "Website Booking",
          status: "Healthy",
          detail: `New booking created for ${findPatient(clinic, values.patientId)?.name || "patient"} and synchronized into the live schedule.`,
        },
      }
    );
  }

  function handleRescheduleAppointment(values) {
    const appointment = clinic.appointments.find(
      (item) => item.id === values.appointmentId
    );

    if (!appointment) {
      return;
    }

    updateClinic(
      (previousClinic) => ({
        ...previousClinic,
        appointments: previousClinic.appointments.map((item) => {
          if (item.id !== values.appointmentId) {
            return item;
          }

          if (values.action === "Cancel") {
            return {
              ...item,
              status: "Cancelled",
            };
          }

          return {
            ...item,
            date: values.date,
            time: values.time,
            status: "Rescheduled",
          };
        }),
      }),
      {
        activity: {
          role: "patient",
          title:
            values.action === "Cancel" ? "Appointment cancelled" : "Appointment rescheduled",
          detail:
            values.action === "Cancel"
              ? `${appointment.patientName} cancelled ${appointment.id}.`
              : `${appointment.patientName} moved ${appointment.id} to ${values.date} at ${values.time}.`,
        },
        integration: {
          service: "Website Booking",
          status: "Healthy",
          detail:
            values.action === "Cancel"
              ? `Cancellation for ${appointment.id} synchronized to the live schedule.`
              : `Reschedule for ${appointment.id} pushed to the live schedule.`,
        },
      }
    );
  }

  function handleCompleteForms(values) {
    const patient = findPatient(clinic, values.patientId);

    if (!patient) {
      return;
    }

    updateClinic(
      (previousClinic) => ({
        ...previousClinic,
        patients: previousClinic.patients.map((item) =>
          item.id === values.patientId
            ? { ...item, formsStatus: "Complete" }
            : item
        ),
        appointments: previousClinic.appointments.map((appointment) =>
          appointment.patientId === values.patientId &&
          appointment.status === "Needs Forms"
            ? { ...appointment, status: "Booked" }
            : appointment
        ),
      }),
      {
        activity: {
          role: "patient",
          title: "Forms completed",
          detail: `${patient.name} completed ${values.formType} and is ready for visit prep.`,
        },
      }
    );
  }

  function handleCheckIn(values) {
    const appointment = clinic.appointments.find(
      (item) => item.id === values.appointmentId
    );

    if (!appointment) {
      return;
    }

    updateClinic(
      (previousClinic) => ({
        ...previousClinic,
        appointments: previousClinic.appointments.map((item) =>
          item.id === values.appointmentId
            ? { ...item, status: "Checked In" }
            : item
        ),
      }),
      {
        activity: {
          role: "patient",
          title: "Patient checked in",
          detail: `${appointment.patientName} checked in at ${values.arrivalTime}.`,
        },
      }
    );
  }

  function handleSaveReminder(values) {
    const patient = findPatient(clinic, values.patientId);

    if (!patient) {
      return;
    }

    updateClinic(
      (previousClinic) => ({
        ...previousClinic,
        patients: previousClinic.patients.map((item) =>
          item.id === values.patientId
            ? { ...item, preferredChannel: values.channel }
            : item
        ),
        communications: [
          {
            id: createId("MSG"),
            patientId: patient.id,
            patientName: patient.name,
            type: values.type,
            channel: values.channel,
            provider: "SMS/Email Service",
            status: "Sent",
            audience: "Patient",
            date: DEMO_TODAY,
          },
          ...previousClinic.communications,
        ],
      }),
      {
        activity: {
          role: "patient",
          title: "Reminder preference updated",
          detail: `${patient.name} saved ${values.channel} as the preferred reminder channel.`,
        },
        integration: {
          service: "SMS/Email Service",
          status: "Healthy",
          detail: `${values.type} prepared for ${patient.name} via ${values.channel}.`,
        },
      }
    );
  }

  function handleWriteClinicalNote(values) {
    const appointment = clinic.appointments.find(
      (item) => item.id === values.appointmentId
    );

    if (!appointment) {
      return;
    }

    updateClinic(
      (previousClinic) => ({
        ...previousClinic,
        notes: [
          {
            id: createId("NOTE"),
            patientId: appointment.patientId,
            patientName: appointment.patientName,
            practitioner: appointment.practitioner,
            date: appointment.date,
            summary: values.note,
          },
          ...previousClinic.notes,
        ],
        appointments: previousClinic.appointments.map((item) =>
          item.id === values.appointmentId
            ? { ...item, status: "Completed" }
            : item
        ),
        patients: previousClinic.patients.map((patient) =>
          patient.id === appointment.patientId
            ? { ...patient, lastVisit: appointment.date }
            : patient
        ),
      }),
      {
        activity: {
          role: "practitioner",
          title: "Clinical note saved",
          detail: `${appointment.practitioner} completed documentation for ${appointment.patientName}.`,
        },
      }
    );
  }

  function handleManageCalendar(values) {
    updateClinic(
      (previousClinic) => ({
        ...previousClinic,
        calendarBlocks: [
          {
            id: createId("BLK"),
            practitioner: values.practitioner,
            date: values.date,
            window: values.window,
            type: values.type,
            note: values.note,
          },
          ...previousClinic.calendarBlocks,
        ],
      }),
      {
        activity: {
          role: "adminFrontDesk",
          title: "Calendar updated",
          detail: `${values.type} added for ${values.practitioner} on ${values.date}.`,
        },
        integration: {
          service: "Website Booking",
          status: "Healthy",
          detail: `${values.type} for ${values.practitioner} synchronized with online availability.`,
        },
      }
    );
  }

  function handleTakePayment(values) {
    const patient = findPatient(clinic, values.patientId);
    const amount = Number(values.amount || 0);

    if (!patient || Number.isNaN(amount)) {
      return;
    }

    updateClinic(
      (previousClinic) => ({
        ...previousClinic,
        payments: [
          {
            id: createId("PAY"),
            patientId: patient.id,
            patientName: patient.name,
            amount,
            method: values.method,
            provider: "Stripe",
            status: "Succeeded",
            date: DEMO_TODAY,
          },
          ...previousClinic.payments,
        ],
        patients: previousClinic.patients.map((item) =>
          item.id === patient.id
            ? { ...item, balance: Math.max(0, item.balance - amount) }
            : item
        ),
      }),
      {
        activity: {
          role: "adminFrontDesk",
          title: "Payment captured",
          detail: `${formatMoney(amount)} collected from ${patient.name}.`,
        },
        integration: {
          service: "Stripe",
          status: "Healthy",
          detail: `Payment for ${patient.name} settled through Stripe at ${formatMoney(amount)}.`,
        },
      }
    );
  }

  function handleManageMembership(values) {
    const patient = findPatient(clinic, values.patientId);
    const price = Number(values.price || 0);

    if (!patient || Number.isNaN(price)) {
      return;
    }

    updateClinic(
      (previousClinic) => {
        const existing = previousClinic.memberships.find(
          (membership) => membership.patientId === patient.id
        );

        const memberships = existing
          ? previousClinic.memberships.map((membership) =>
              membership.patientId === patient.id
                ? {
                    ...membership,
                    plan: values.plan,
                    price,
                    renewalDate: values.renewalDate,
                    status: "Active",
                  }
                : membership
            )
          : [
              {
                id: createId("MEM"),
                patientId: patient.id,
                patientName: patient.name,
                plan: values.plan,
                price,
                provider: "GoCardless",
                status: "Active",
                renewalDate: values.renewalDate,
              },
              ...previousClinic.memberships,
            ];

        return {
          ...previousClinic,
          memberships,
        };
      },
      {
        activity: {
          role: "adminFrontDesk",
          title: "Membership updated",
          detail: `${patient.name} is now on ${values.plan}.`,
        },
        integration: {
          service: "GoCardless",
          status: "Healthy",
          detail: `${values.plan} saved for ${patient.name} with recurring billing ready.`,
        },
      }
    );
  }

  function handleTriggerRecall(values) {
    const targets = clinic.patients.filter((patient) => {
      if (values.segment === "All overdue") {
        return ["Due", "Renewal Due"].includes(patient.recallStatus);
      }

      return patient.recallStatus === values.segment;
    });

    if (targets.length === 0) {
      return;
    }

    updateClinic(
      (previousClinic) => ({
        ...previousClinic,
        communications: [
          ...targets.map((patient) => ({
            id: createId("MSG"),
            patientId: patient.id,
            patientName: patient.name,
            type: "Recall",
            channel: values.channel,
            provider: "SMS/Email Service",
            status: "Queued",
            audience: "Patient",
            date: DEMO_TODAY,
          })),
          ...previousClinic.communications,
        ],
        patients: previousClinic.patients.map((patient) =>
          targets.some((target) => target.id === patient.id)
            ? { ...patient, recallStatus: "Recall Sent" }
            : patient
        ),
      }),
      {
        activity: {
          role: "adminFrontDesk",
          title: "Recall campaign queued",
          detail: `${targets.length} patient${targets.length === 1 ? "" : "s"} added to a ${values.channel} recall batch.`,
        },
        integration: {
          service: "SMS/Email Service",
          status: "Healthy",
          detail: `${targets.length} recall message${targets.length === 1 ? "" : "s"} queued for delivery.`,
        },
      }
    );
  }

  function handleManageCommunication(values) {
    let audienceTargets = [];

    if (values.audience === "All patients") {
      audienceTargets = clinic.patients;
    } else if (values.audience === "Tomorrow's patients") {
      audienceTargets = clinic.appointments
        .filter((appointment) => appointment.date === DEMO_TOMORROW)
        .map((appointment) => findPatient(clinic, appointment.patientId))
        .filter(Boolean);
    } else {
      audienceTargets = clinic.patients.filter((patient) =>
        Boolean(getPatientMembership(clinic, patient.id))
      );
    }

    updateClinic(
      (previousClinic) => ({
        ...previousClinic,
        communications: [
          ...audienceTargets.map((patient) => ({
            id: createId("MSG"),
            patientId: patient.id,
            patientName: patient.name,
            type: values.template,
            channel: values.channel,
            provider: "SMS/Email Service",
            status: "Queued",
            audience: values.audience,
            date: DEMO_TODAY,
          })),
          ...previousClinic.communications,
        ],
      }),
      {
        activity: {
          role: "adminFrontDesk",
          title: "Communication queued",
          detail: `${values.template} prepared for ${values.audience.toLowerCase()}.`,
        },
        integration: {
          service: "SMS/Email Service",
          status: "Healthy",
          detail: `${audienceTargets.length} message${audienceTargets.length === 1 ? "" : "s"} queued using ${values.template}.`,
        },
      }
    );
  }

  function handleRunReport(values) {
    const summaryByType = {
      Bookings: `${clinic.appointments.filter((appointment) => appointment.status !== "Cancelled").length} live appointments with ${
        clinic.appointments.filter((appointment) => appointment.source === "Website Booking").length
      } originating from online booking.`,
      Revenue: `${formatMoney(
        clinic.payments.reduce((total, payment) => total + payment.amount, 0)
      )} collected across ${clinic.payments.length} logged payments.`,
      Memberships: `${clinic.memberships.filter((membership) => membership.status === "Active").length} active memberships with next renewals already queued.`,
      Communications: `${clinic.communications.length} communication records with ${
        clinic.communications.filter((communication) => communication.status === "Queued").length
      } still queued.`,
    };

    updateClinic(
      (previousClinic) => ({
        ...previousClinic,
        reports: [
          {
            id: createId("REP"),
            title: `${values.reportType} report`,
            format: values.format,
            timeframe: values.timeframe,
            requestedAt: DEMO_TODAY,
            summary: summaryByType[values.reportType],
          },
          ...previousClinic.reports,
        ],
      }),
      {
        activity: {
          role: "manager",
          title: "Report generated",
          detail: `${values.reportType} report prepared for ${values.timeframe} in ${values.format} format.`,
        },
      }
    );
  }

  function handleConfigureAutomation(values) {
    updateClinic(
      (previousClinic) => {
        const existing = previousClinic.automations.find(
          (automation) => automation.name === values.name
        );

        const automations = existing
          ? previousClinic.automations.map((automation) =>
              automation.name === values.name
                ? {
                    ...automation,
                    triggerWindow: values.triggerWindow,
                    strategy: values.strategy || automation.strategy,
                    status: "Active",
                  }
                : automation
            )
          : [
              {
                id: createId("AUTO"),
                name: values.name,
                triggerWindow: values.triggerWindow,
                strategy: values.strategy,
                status: "Active",
              },
              ...previousClinic.automations,
            ];

        return {
          ...previousClinic,
          automations,
        };
      },
      {
        activity: {
          role: "manager",
          title: "Automation updated",
          detail: `${values.name} saved with a trigger window of ${values.triggerWindow}.`,
        },
        integration: {
          service: "SMS/Email Service",
          status: "Healthy",
          detail: `${values.name} automation is active and ready to drive outbound messaging.`,
        },
      }
    );
  }

  return (
    <>
      <div aria-hidden="true" className="backdrop">
        <span className="backdrop__glow backdrop__glow--a"></span>
        <span className="backdrop__glow backdrop__glow--b"></span>
        <span className="backdrop__glow backdrop__glow--c"></span>
      </div>

      <div className="page-shell">
        <Hero clinic={clinic} />

        <main className="app-layout">
          <OverviewBar clinic={clinic} />

          <section className="card command-center" id="command-center">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Command Center</p>
                <h2>Role-aware workspace backed by shared clinic data.</h2>
              </div>
              <p className="section-copy">
                Changing data in one role updates the same records that power the
                other roles, the manager views, and the external system panels.
              </p>
            </div>

            <div className="toolbar">
              <div className="toolbar__copy">
                <p className="eyebrow">Role</p>
                <h3>{activeRoleConfig.label}</h3>
                <p>{activeRoleConfig.summary}</p>
              </div>
              <div className="toolbar__controls">
                <div className="field field--compact">
                  <label htmlFor="focusPatient">Focus patient</label>
                  <select
                    id="focusPatient"
                    onChange={(event) => setFocusPatientId(event.target.value)}
                    value={focusPatient ? focusPatient.id : ""}
                  >
                    {clinic.patients.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field field--compact">
                  <label htmlFor="recordSearch">Search records</label>
                  <input
                    id="recordSearch"
                    onChange={(event) => setRecordSearch(event.target.value)}
                    placeholder="Search patient, note, report..."
                    type="text"
                    value={recordSearch}
                  />
                </div>
                <button
                  className="button button--ghost"
                  onClick={() => {
                    setClinic(cloneInitialData());
                    setFocusPatientId(cloneInitialData().patients[0].id);
                  }}
                  type="button"
                >
                  Reset Demo Data
                </button>
              </div>
            </div>

            <RoleSwitcher activeRole={activeRole} onChange={handleRoleChange} />
            <ModuleTabs
              activeModule={activeModuleConfig.id}
              modules={activeRoleConfig.modules}
              onChange={handleModuleChange}
            />

            <div className="command-grid">
              <div className="command-main">
                <WorkspaceRenderer
                  activeModule={activeModule}
                  activeRole={activeRole}
                  clinic={clinic}
                  focusPatient={focusPatient}
                  onBookAppointment={handleBookAppointment}
                  onCheckIn={handleCheckIn}
                  onCompleteForms={handleCompleteForms}
                  onConfigureAutomation={handleConfigureAutomation}
                  onManageCalendar={handleManageCalendar}
                  onManageCommunication={handleManageCommunication}
                  onManageMembership={handleManageMembership}
                  onRescheduleAppointment={handleRescheduleAppointment}
                  onRunReport={handleRunReport}
                  onSaveReminder={handleSaveReminder}
                  onTakePayment={handleTakePayment}
                  onTriggerRecall={handleTriggerRecall}
                  onWriteClinicalNote={handleWriteClinicalNote}
                />
              </div>

              <aside className="command-rail">
                <FocusPatientCard clinic={clinic} patient={focusPatient} />
                <IntegrationPulse clinic={clinic} />
                <ActivityFeed clinic={clinic} />
              </aside>
            </div>
          </section>

          <AppointmentsBoard
            appointments={filteredRecords.appointments}
            calendarBlocks={clinic.calendarBlocks}
          />

          <div className="board-stack">
            <FinanceBoard memberships={clinic.memberships} payments={clinic.payments} />
            <CommunicationBoard
              automations={clinic.automations}
              communications={filteredRecords.communications}
            />
          </div>

          <RecordsBoard clinic={clinic} filteredRecords={filteredRecords} />
          <SystemsBoard clinic={clinic} />
        </main>
      </div>
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
