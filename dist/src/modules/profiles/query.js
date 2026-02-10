"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    getProfileByUserId: `
    SELECT 
      u.id,
      u.first_name,
      u.last_name,
      u.country_code,
      u.phone_number,
      u.email,
      u.avatar,
      u.username,
      u.bio,
      u.instagram,
      u.youtube,
      u.twitter,
      u.created_at,
      u.updated_at
    FROM users u
    WHERE u.id = $1;
  `,
    updateProfile: `
    UPDATE users 
    SET 
      first_name = COALESCE($2, first_name),
      last_name = COALESCE($3, last_name),
      country_code = COALESCE($4, country_code),
      phone_number = COALESCE($5, phone_number),
      avatar = COALESCE($6, avatar),
      username = COALESCE($7, username),
      bio = COALESCE($8, bio),
      instagram = COALESCE($9, instagram),
      youtube = COALESCE($10, youtube),
      twitter = COALESCE($11, twitter),
      updated_at = NOW()
    WHERE id = $1
    RETURNING id, first_name, last_name, country_code, phone_number, email, avatar, username, bio, instagram, youtube, twitter, created_at, updated_at;
  `,
};
//# sourceMappingURL=query.js.map