/**
 * Mocks the calculation for the payment deadline of a classroom query.
 * The payment deadline is the earliest of:
 * - 24 hours after teacher approval
 * - 2 hours before the next scheduled classroom session
 *
 * @param {string} classroomId - The ID of the classroom
 * @returns {object} { paymentDeadline: Date, sessionStarted: boolean }
 */
export const calculatePaymentDeadline = (classroomId) => {
  const now = new Date();
  const maxDeadline = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

  // Mock different edge cases based on classroomId ending (for demonstration purposes)
  const idStr = String(classroomId);
  
  if (idStr.endsWith('4')) {
    // Case 4: Session has already started
    return {
      paymentDeadline: null,
      sessionStarted: true
    };
  } else if (idStr.endsWith('3')) {
    // Case 3: Next class starts very soon (e.g., 1 hour from now)
    // Deadline is "2 hours before", which means it's already past or immediate payment required.
    // Let's set the deadline to 30 minutes from now to simulate urgent deadline.
    return {
      paymentDeadline: new Date(now.getTime() + 30 * 60 * 1000).toISOString(),
      sessionStarted: false
    };
  } else if (idStr.endsWith('2')) {
    // Case 2: Next class starts in 10 hours. Deadline is 2 hours before = 8 hours from now.
    return {
      paymentDeadline: new Date(now.getTime() + 8 * 60 * 60 * 1000).toISOString(),
      sessionStarted: false
    };
  }
  
  // Case 1 (Default): Next class is several days away, so 24 hours applies.
  return {
    paymentDeadline: maxDeadline.toISOString(),
    sessionStarted: false
  };
};

/**
 * Calculates remaining time formatted string and if it's expired or urgent.
 * @param {string} deadlineIsoString 
 * @returns {object} { expired: boolean, isUrgent: boolean, text: string }
 */
export const getPaymentTimer = (deadlineIsoString) => {
  if (!deadlineIsoString) return { expired: true, isUrgent: false, text: 'No Deadline' };
  
  const deadlineDate = new Date(deadlineIsoString);
  const now = new Date();
  
  if (now >= deadlineDate) {
    return { expired: true, isUrgent: false, text: 'Expired' };
  }
  
  const diffMs = deadlineDate - now;
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours < 2) {
    return {
      expired: false,
      isUrgent: true,
      text: `${hours}h ${mins}m`
    };
  }
  
  return {
    expired: false,
    isUrgent: false,
    text: `${hours}h ${mins}m`
  };
};
