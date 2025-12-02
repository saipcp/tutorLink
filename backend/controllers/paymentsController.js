import pool from '../config/database.js';

// Get transaction history for the authenticated user
export const getTransactions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { status, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT 
        p.id,
        p.amount,
        p.currency,
        p.method,
        p.status,
        p.paidAt,
        p.createdAt,
        p.sessionId,
        s.startAt as sessionStartAt,
        s.endAt as sessionEndAt,
        s.status as sessionStatus,
        sub.name as subjectName,
        t.name as topicName,
        tutorProf.id as tutorProfileId,
        tutorUser.firstName as tutorFirstName,
        tutorUser.lastName as tutorLastName,
        pm.details as paymentMethodDetails,
        pm.type as paymentMethodType
      FROM payments p
      LEFT JOIN sessions s ON p.sessionId = s.id
      LEFT JOIN subjects sub ON s.subjectId = sub.id
      LEFT JOIN topics t ON s.topicId = t.id
      LEFT JOIN tutor_profiles tutorProf ON s.tutorId = tutorProf.id
      LEFT JOIN users tutorUser ON tutorProf.userId = tutorUser.id
      LEFT JOIN payment_methods pm ON p.paymentMethodId = pm.id
      WHERE p.payerId = ?
    `;

    const params = [userId];

    if (status) {
      query += ' AND p.status = ?';
      params.push(status);
    }

    query += ' ORDER BY p.createdAt DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [transactions] = await pool.execute(query, params);

    // Format transactions for frontend
    const formattedTransactions = transactions.map((txn) => {
      // Generate description from session info
      let description = 'Payment';
      if (txn.subjectName) {
        description = `${txn.subjectName}${txn.topicName ? ` - ${txn.topicName}` : ''} Session`;
        if (txn.tutorFirstName && txn.tutorLastName) {
          description += ` with ${txn.tutorFirstName} ${txn.tutorLastName}`;
        }
      } else if (txn.sessionId) {
        description = 'Tutoring Session';
      }

      // Format payment method display name
      let methodDisplay = 'Unknown';
      if (txn.paymentMethodType) {
        const methodMap = {
          card: 'Credit Card',
          ach: 'ACH Transfer',
          paypal: 'PayPal',
          bank: 'Bank Account',
          wire: 'Wire Transfer',
        };
        methodDisplay = methodMap[txn.paymentMethodType] || txn.paymentMethodType;
      }

      // Generate reference ID
      const reference = `TXN-${txn.id.substring(0, 8).toUpperCase()}`;

      return {
        id: txn.id,
        date: txn.paidAt || txn.createdAt,
        description,
        amount: parseFloat(txn.amount),
        status: txn.status,
        method: methodDisplay,
        reference,
        sessionId: txn.sessionId,
        currency: txn.currency || 'USD',
      };
    });

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM payments WHERE payerId = ?';
    const countParams = [userId];
    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }
    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      transactions: formattedTransactions,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    next(error);
  }
};

// Get a single transaction by ID
export const getTransactionById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const [transactions] = await pool.execute(
      `SELECT 
        p.id,
        p.amount,
        p.currency,
        p.method,
        p.status,
        p.paidAt,
        p.createdAt,
        p.sessionId,
        s.startAt as sessionStartAt,
        s.endAt as sessionEndAt,
        s.status as sessionStatus,
        sub.name as subjectName,
        t.name as topicName,
        tutorProf.id as tutorProfileId,
        tutorUser.firstName as tutorFirstName,
        tutorUser.lastName as tutorLastName,
        pm.details as paymentMethodDetails,
        pm.type as paymentMethodType
      FROM payments p
      LEFT JOIN sessions s ON p.sessionId = s.id
      LEFT JOIN subjects sub ON s.subjectId = sub.id
      LEFT JOIN topics t ON s.topicId = t.id
      LEFT JOIN tutor_profiles tutorProf ON s.tutorId = tutorProf.id
      LEFT JOIN users tutorUser ON tutorProf.userId = tutorUser.id
      LEFT JOIN payment_methods pm ON p.paymentMethodId = pm.id
      WHERE p.id = ? AND p.payerId = ?`,
      [id, userId]
    );

    if (transactions.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const txn = transactions[0];
    let description = 'Payment';
    if (txn.subjectName) {
      description = `${txn.subjectName}${txn.topicName ? ` - ${txn.topicName}` : ''} Session`;
      if (txn.tutorFirstName && txn.tutorLastName) {
        description += ` with ${txn.tutorFirstName} ${txn.tutorLastName}`;
      }
    } else if (txn.sessionId) {
      description = 'Tutoring Session';
    }

    const methodMap = {
      card: 'Credit Card',
      ach: 'ACH Transfer',
      paypal: 'PayPal',
      bank: 'Bank Account',
      wire: 'Wire Transfer',
    };
    const methodDisplay = methodMap[txn.paymentMethodType] || txn.paymentMethodType || 'Unknown';

    res.json({
      id: txn.id,
      date: txn.paidAt || txn.createdAt,
      description,
      amount: parseFloat(txn.amount),
      status: txn.status,
      method: methodDisplay,
      reference: `TXN-${txn.id.substring(0, 8).toUpperCase()}`,
      sessionId: txn.sessionId,
      currency: txn.currency || 'USD',
      sessionStartAt: txn.sessionStartAt,
      sessionEndAt: txn.sessionEndAt,
      sessionStatus: txn.sessionStatus,
      paymentMethodDetails: txn.paymentMethodDetails,
    });
  } catch (error) {
    next(error);
  }
};

