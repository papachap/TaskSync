# TaskSync

A lightweight, open-source task tracker with time logging and calendar view — built to work alongside Microsoft Teams and Outlook.

![TaskSync](https://img.shields.io/badge/version-0.1.0-brightgreen) ![License](https://img.shields.io/badge/license-MIT-blue)

---

## Features

- **Task Tracking** — Create, filter, and manage tasks by status (To Do / In Progress / Done)
- **Time Logging** — Log hours per task with start/end times and auto-calculated duration
- **Calendar View** — See tasks by due date in a monthly calendar
- **Auto-save** — All data persists in localStorage — nothing is ever lost on refresh
- **Dashboard** — At-a-glance stats: total tasks, completed, in progress, hours logged

---

## Roadmap

- [ ] SharePoint integration (cloud sync for teams)
- [ ] Microsoft Teams notifications via webhook
- [ ] Outlook calendar export (.ics)
- [ ] Multi-user support
- [ ] Tags and priority levels
- [ ] CSV/Excel export with durations

---

## Getting Started

No build step required. Just open `src/index.html` in your browser.

```bash
git clone https://github.com/YOUR_USERNAME/TaskSync.git
cd TaskSync
open src/index.html
```

Or serve it locally:

```bash
npx serve src
```

---

## Project Structure

```
TaskSync/
├── src/
│   ├── index.html   # Main app shell
│   ├── style.css    # All styles
│   └── app.js       # App logic + localStorage persistence
├── docs/            # Documentation (coming soon)
└── README.md
```

---

## Contributing

Pull requests are welcome! For major changes, please open an issue first.

---

## License

MIT
