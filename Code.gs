// Enums


/**
 * Enum for Day, corresponds with Date day format
 */
const Day = {
  Sunday: 0, 
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6, 
};

const Type = {
  RegularDay: 0,
  EightBlockDay: 1,
  HalfDay: 2
}

/**
 * @type {Record<string, Type[string]>}
 */
const typeMapping = {
  "A Day (high school)": Type.RegularDay,
  "B Day (high school)": Type.RegularDay,
  "C Day (high school)": Type.RegularDay,
  "D Day (high school)": Type.RegularDay,
  "8 block rotation (high school)": Type.EightBlockDay,
  "8 Block Day (high school)": Type.EightBlockDay
};

const SpecialEvent = {
  LateStart: "Educator Inservice Morning (10:00 a.m. start)",
  EarlyEnd: 1
}

/**
 * @type {Record<string, SpecialEvent[string]>}
 */
const specialEventMapping = {
  "Educator Inservice Morning (10:00 a.m. start)": SpecialEvent.LateStart
}


/**
 * @typedef {Object[]} ClassTimes - Type for the definition of class times
 * @property {Day[]} ClassTimes[].days - The days of the week where this schedule applies
 * @property {string[]} ClassTimes[].times - The time of the beginning of each class in HH:MM
 * @property {string} ClassTimes[].duration - Duration of each class in HH:MM
 * @property {Type[string]} ClassTimes[].type - Type of day for schedule
 * @property {SpecialEvent | undefined} ClassTimes[].event - Applies if a special event is on that day which alters the schedule
 * @property {{ duration: string, "11/12": string, "9/10": string } | undefined} ClassTimes[].advisory - Information about advisory time and duration if applicable
 * 
  * @typedef {Object[]} ClassTimeCompiled - Type for the definition of class times
 * @property {Day[]} ClassTimeCompiled[].days - The days of the week where this schedule applies
 * @property {number[]} ClassTimeCompiled[].times - The time of the beginning of each class in HH:MM
 * @property {number} ClassTimeCompiled[].duration - Duration of each class in HH:MM
 * @property {Type[string]} ClassTimeCompiled[].type - Type of day for schedule
 * @property {SpecialEvent | undefined} ClassTimeCompiled[].event - Applies if a special event is on that day which alters the schedule
 * @property {{ duration: number, "11/12": number, "9/10": number } | undefined} ClassTimeCompiled[].advisory - Information about advisory time and duration if applicable
 * 
 * 
 * @typedef {{ class: string, location: string, busy: boolean, year: "9/10" | "11/12" }} AdvisoryInfo - Information about advisory sent by client
 * 
 * @typedef {Record<string, {class: string, location: string, busy: boolean}[]> & { advisory: AdvisoryInfo | undefined }} Classes
 */



// Classes

/**
 * Stores class times and returns what time the class should be given the day and period.
 * 
 * @
 */
class TimeManager {
  /**
   * @param {ClassTimes} classTimes
   * @param {Record<Date, SpecialEvent[string]>} specialEvents - Mapping between date and type of special event if applicable
   * @param {AdvisoryInfo | undefined} advisoryInfo - Information about advisory sent by client
   */
  constructor(classTimes, specialEvents, advisoryInfo = undefined) {
    /**
     * @type ClassTimeCompiled
     */
    this.classTimes = classTimes.map(schedule => {
      let compiled = {
        ...schedule,
        times: schedule.times.map((time) => {
          return TimeManager.timeStrToNum(time);
        }),
        duration: TimeManager.timeStrToNum(schedule.duration)
      }
      
      if (schedule.advisory) {
        compiled.advisory = {
          duration: TimeManager.timeStrToNum(schedule.advisory.duration),
          "9/10": TimeManager.timeStrToNum(schedule.advisory["9/10"]),
          "11/12": TimeManager.timeStrToNum(schedule.advisory["11/12"]),
        };
      }

      return compiled;
    });

    this.advisoryInfo = advisoryInfo;
    this.specialEvents = specialEvents;

    this.doneAdv = {};

    // Logger.log(["class times", this.classTimes, "class duration", this.classDuration].join(" "));
  }

  /**
   * Converts time string in HH:MM to time number in ms
   * @param {string} time - time in "HH:MM"
   * @returns {number} time in ms
   */
  static timeStrToNum(time) {
    time = time.split(":").map(i => Number(i));
    return time[0] * 1000 * 60 * 60 + time[1] * 1000 * 60;
  }

  /**
   * @param {Date} date - date of class, don't include a time
   * @param {Type[string]} type - Type of day
   * @param {number} classIndex - Index of class with regards to classTimes
   * @returns {{startTime: Date, endTime: Date}} object containing startTime and endTime in Date object
   */
  getClassTimes(date, type, classIndex) {
    let schedule = this.getSchedule(date, type);
     
    if (!schedule?.times || !schedule?.duration) {
      throw new Error("Schedule not found with correct day and type");
    }

    Logger.log(schedule)
    const startTime = new Date(date.getTime() + schedule.times[classIndex]);
    return {
      startTime,
      endTime: new Date(startTime.getTime() + schedule.duration)
    }
  }

  getAdvisoryTimes(date, type) {
    if (!this.advisoryInfo) return false;

    let schedule = this.getSchedule(date, type);

    if (!schedule?.times || !schedule?.duration) {
      throw new Error("Schedule not found with correct day and type");
    }

    const startTime = new Date(date.getTime() + schedule.advisory[this.advisoryInfo.year]);
    return {
      startTime,
      endTime: new Date(startTime.getTime() + schedule.advisory.duration)
    }
  }
  
  /**
   * @param {Date} date - date of class, don't include a time
   * @param {Type[string]} type - Type of day
   * @returns {ClassTimeCompiled[number]}
   */
  getSchedule(date, type) {
    let schedule;
    if (this.specialEvents[date]) {
      schedule = this.classTimes.find((schedule) => {
        return schedule.days.includes(date.getDay()) && schedule.type == type && schedule.event == this.specialEvents[date];
      });
    } else {
      schedule = this.classTimes.find((schedule) => {
        return schedule.days.includes(date.getDay()) && schedule.type == type;
      });
    }
    return schedule;
  }

  /**
   * @param {Date} date - date of class, don't include a time
   * @param {Type[string]} type - Type of day
   * @returns {boolean}
   */
  doAdvisory(date, type) {
    if (!this.advisoryInfo) return false;
    let schedule = this.getSchedule(date, type);
    if (schedule.advisory && !this.doneAdv[date]) return true;
    return false;
  }


}


/**
 * @type {ClassTimes}
 */
const classTimes = [
  {
    days: [Day.Monday],
    times: ["8:00", "9:30", "12:10", "13:40"],
    duration: "1:20",
    type: Type.RegularDay
  },
  {
    days: [Day.Tuesday, Day.Friday],
    times: ["8:00", "9:30", "12:10", "13:40"],
    duration: "1:20",
    type: Type.RegularDay,
    advisory: {
      "9/10": "11:30",
      "11/12": "10:55",
      duration: "0:30"
    }
  },
  {
    days: [Day.Wednesday, Day.Thursday],
    times: ["8:30", "10:00", "12:10", "13:40"],
    duration: "1:20",
    type: Type.RegularDay
  },
  {
    days: [Day.Wednesday, Day.Thursday],
    times: ["8:30", "9:15", "10:00", "10:45", "12:10", "12:55", "13:40", "14:25"],
    duration: "0:35",
    type: Type.EightBlockDay
  }, 
  {
    days: [Day.Monday, Day.Tuesday, Day.Wednesday, Day.Thursday, Day.Friday],
    times: ["10:00", "11:05", "12:55", "14:00"],
    duration: "1:00",
    type: Type.RegularDay,
    event: SpecialEvent.LateStart
  }
]


function allowOrgFreeBusy(calendar) {
  var calendarId = calendar.getId();
  var domain = Session.getActiveUser().getEmail().split('@').pop();
  var ruleId = 'domain:' + domain;
  var desiredRole = 'freeBusyReader';

  try {
    Calendar.Acl.insert(
      { role: desiredRole, scope: { type: 'domain', value: domain } },
      calendarId
    );
  } catch (e) {
    var msg = String(e);
    if (msg.includes('409') || msg.toLowerCase().includes('exists')) {
      var existing = Calendar.Acl.get(calendarId, ruleId);
      if (existing.role !== desiredRole) {
        existing.role = desiredRole;
        Calendar.Acl.update(existing, calendarId, ruleId);
      }
    } else {
      throw e;
    }
  }
}



function fetchProgress() {
  var email = Session.getEffectiveUser().getEmail();
  Logger.log("This instance is being run under " + email + " with meta tag");
  
  const cache = CacheService.getUserCache();
  return {
    count: Number(cache.get("count")),
    totalCount: Number(cache.get("totalCount")),
  }
}

/**
 * @param {Classes} classes
 */
function createCalendar(calendarName, classes, startDate, endDate) {
  calendarName = calendarName == "" ? "Daily Classes" : calendarName;
  var email = Session.getEffectiveUser().getEmail();
  Logger.log("This instance is being run under " + email);


  const cache = CacheService.getUserCache();
  // const systemCache = CacheService.getDocumentCache();

  // const userCache = systemCache.get("users");
  // systemCache.put("users", userCache ? (userCache + "," + email) : email);

  cache.put("count", 0);
  cache.put("totalCount", -1);


  if (CalendarApp.getCalendarsByName('High School').length < 1) {
    CalendarApp.subscribeToCalendar('c_2af9eb0a306368f462c783376a7ead825401833c4ca19166dae062b8beee28ca@group.calendar.google.com');
  }
  if (CalendarApp.getCalendarsByName('Schoolwide').length < 1) {
    CalendarApp.subscribeToCalendar('c_4a8d2064423a63ffcb6f60bfeb6f68d8feb851e9a59466d52d01d59016f0d55a@group.calendar.google.com');
  }
  
  if (CalendarApp.getCalendarsByName(calendarName).length < 1) {
    CalendarApp.createCalendar(calendarName);
  }

  
  const scheduleCalendar = CalendarApp.getCalendarsByName(calendarName)[0];
  const highSchool = CalendarApp.getCalendarsByName("High School")[0];
  const schoolwideCalendar = CalendarApp.getCalendarsByName("Schoolwide")[0];
  
  
  //sets the timezone the calendar is created in
  if (scheduleCalendar.getTimeZone() !== 'Asia/Singapore') {
    scheduleCalendar.setTimeZone('Asia/Singapore');
  }

  allowOrgFreeBusy(scheduleCalendar);



  var start = new Date(startDate);
  var end = new Date(endDate);
  
  var events = highSchool.getEvents(start, end);

  const schoolwideEvents = schoolwideCalendar.getEvents(start, end);

  let specialEvents = {};

  schoolwideEvents.forEach((e => {
    const title = e.getTitle().trim();

    if (!title) return;
    if (!specialEventMapping[title]) return;
 
    switch (title) {
      case SpecialEvent.LateStart:
        specialEvents[new Date(e.getStartTime().toDateString())] = SpecialEvent.LateStart;
        break;
      default:
        return;
    }
    
  }));

  let args = [classTimes, specialEvents];
  if (classes.advisory) {
    args.push(classes.advisory);
  }

  const timeManager = new TimeManager(...args);

  var totalEventCount = 0;

  events.forEach((e) => {
    var title = e.getTitle().trim();
    if (!e.isAllDayEvent()) {
      return;
    }
    if (!title) return;
    if (classes[title] == undefined) {
      return;
    }
    if (typeMapping[title] == undefined) {
      return;
    }
    var date = e.getAllDayStartDate();
    if (timeManager.doAdvisory(date, typeMapping[title])) {
      totalEventCount++;
      timeManager.doneAdv[date] = true;
    }
    for (var i = 0; i < classes[title].length; i++) {
      var e = classes[title][i];
      if (e.class) {
        totalEventCount++;
      }
    }
  });
  
  cache.put("totalCount", totalEventCount);

  timeManager.doneAdv = [];

  var count = 0;

  events.forEach(function (e) {
    var title = e.getTitle().trim();
    if (!e.isAllDayEvent()) {
      return;
    }
    if (!title) return;
    //var date = Utilities.formatDate(new e.getAllDayStartDate(), "Asia/Singapore","dd-mm-yy HH:mm");
    var date = e.getAllDayStartDate();
    if (classes[title] == undefined) {
      return;
    }
    if (typeMapping[title] == undefined) {
      return;
    }

    const dayType = typeMapping[title];

    if (timeManager.doAdvisory(date, dayType)) {
      const { startTime, endTime } = timeManager.getAdvisoryTimes(date, dayType);
      Logger.log([startTime, endTime, date, "ADVISORY"].join(" "));
      let event = scheduleCalendar.createEvent(timeManager.advisoryInfo.class, startTime, endTime, {
        location: timeManager.advisoryInfo.location,
      });

      event.setTransparency(timeManager.advisoryInfo.busy ? CalendarApp.EventTransparency.OPAQUE : CalendarApp.EventTransparency.TRANSPARENT)
      timeManager.doneAdv[date] = true;
      count++;
      cache.put("count", Number(count));
      Utilities.sleep(200); // have to be more than 50
    }

    for (var i = 0; i < classes[title].length; i++) {
      var e = classes[title][i];
      if (e.class) {
        const { startTime, endTime } = timeManager.getClassTimes(date, dayType, i);
        Logger.log([startTime, endTime, date, i].join(" "))
        let event = scheduleCalendar.createEvent(e.class, startTime, endTime, {
          location: e.location,
          
        });
        event.setTransparency(e.busy ? CalendarApp.EventTransparency.OPAQUE : CalendarApp.EventTransparency.TRANSPARENT)
        count++;
        cache.put("count", Number(count));
        Utilities.sleep(200); // have to be more than 50
      }
    }
  });
  cache.put("totalCount", -1);
  cache.put("count", 0);
  
  scheduleCalendar.setSelected(true);

  Logger.log("This instance was run under " + email);
}
 function doGet() {
  var email = Session.getEffectiveUser().getEmail();
  Logger.log("This instance is being run under " + email + " with meta tag");
  
   const output = HtmlService.createHtmlOutputFromFile('index.html');
   output.setTitle("SAS Daily Calendar Script");
   output.addMetaTag('viewport', 'width=device-width, initial-scale=1');

   return output;
 }
