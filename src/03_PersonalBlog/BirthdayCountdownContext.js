import React, { useContext } from 'react';
import differenceInCalendarDays from 'date-fns/differenceInCalendarDays'

import { UserContext } from './UserContext1';

function getDaysLeft(month, day) {
  const now = new Date();
  const nextBirthday = new Date(now.getFullYear(), month - 1, day);

  if (nextBirthday < now) {
    nextBirthday.setFullYear(now.getFullYear() + 1);
  }

  return differenceInCalendarDays(nextBirthday, now);
}

function BirthdayCountdown() {
  const { birthMonth, birthDay } = useContext(UserContext);

  return (
    <section>
      There are {getDaysLeft(birthMonth, birthDay)} days left until your birthday!
    </section>
  );
}

export default BirthdayCountdown;