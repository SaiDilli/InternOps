const pool = require('../../config/db');

async function createDepartment(name, createdBy) {
  const res = await pool.query(
    'INSERT INTO departments (name, created_by) VALUES ($1,$2) RETURNING *',
    [name, createdBy]
  );
  return res.rows[0];
}

async function getAll() {
  return (
    await pool.query(
      'SELECT * FROM departments WHERE deleted_at IS NULL ORDER BY name'
    )
  ).rows;
}

async function deleteDepartment(id, force = false) {
  const { rows } = await pool.query(
    `
    SELECT COUNT(*)::int AS user_count
    FROM users
    WHERE department_id = $1
      AND deleted_at IS NULL
    `,
    [id]
  );

  const userCount = Number(rows[0].user_count);

  if (userCount > 0 && !force) {
    return {
      success: false,
      userCount,
    };
  }

  if (force) {
    const result = await pool.query(
      `
      DELETE FROM departments
      WHERE id = $1
      RETURNING id
      `,
      [id]
    );

    if (result.rowCount === 0) {
      return {
        success: false,
        userCount: 0,
      };
    }
  } else {
    const result = await pool.query(
      `
      UPDATE departments
      SET deleted_at = NOW(),
          updated_at = NOW()
      WHERE id = $1
      RETURNING id
      `,
      [id]
    );

    if (result.rowCount === 0) {
      return {
        success: false,
        userCount: 0,
      };
    }
  }

  return {
    success: true,
    userCount,
  };
}

module.exports = {
  createDepartment,
  getAll,
  deleteDepartment,
};