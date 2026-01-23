export default {
    createUser: `
        INSERT INTO 
            users(email, password)
        VALUES 
            ($(email), $(password))
        RETURNING id
    `,
    createProfile: `
        INSERT INTO
            profiles(user_id, first_name, last_name)
        VALUES
            ($(user_id), $(first_name), $(last_name))
    `,
    getUser: `
        SELECT
            users.id,
            email,
            password,
            verified,
            first_name,
            last_name
        FROM
            users
        LEFT JOIN profiles ON profiles.user_id = users.id
        WHERE
            users.id = $1 OR email = $1
    `,
    verifyUser: `
        UPDATE users
        SET
            verified = true,
            updated_at = NOW()
        WHERE email = $1
    `,
};
