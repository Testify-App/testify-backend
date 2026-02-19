export default {
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

  // Add to Tribe (follow)
  addToTribe: `
    INSERT INTO user_follows (follower_id, following_id)
    VALUES ($1, $2)
    ON CONFLICT (follower_id, following_id) DO NOTHING
    RETURNING *;
  `,

  // Remove from Tribe (unfollow)
  removeFromTribe: `
    DELETE FROM user_follows
    WHERE follower_id = $1 AND following_id = $2;
  `,

  // Get Tribe members
  getTribeMembers: `
    SELECT u.id, u.username, u.avatar, uf.created_at as followed_at
    FROM user_follows uf
    JOIN users u ON uf.following_id = u.id
    WHERE uf.follower_id = $1
    ORDER BY uf.created_at DESC
    LIMIT $2 OFFSET $3;
  `,

  // Get Tribe count
  getTribeCount: `
    SELECT COUNT(*) as total FROM user_follows
    WHERE follower_id = $1;
  `,

  // Check if user is in Tribe
  isInTribe: `
    SELECT EXISTS(
      SELECT 1 FROM user_follows
      WHERE follower_id = $1 AND following_id = $2
    );
  `,

  // Get follower count (users who follow this user)
  getFollowerCount: `
    SELECT COUNT(*) as total FROM user_follows
    WHERE following_id = $1;
  `,

  // Check if user exists
  checkUserExists: `
    SELECT EXISTS(SELECT 1 FROM users WHERE id = $1);
  `,

  // Circle queries

  // Send Circle request
  sendCircleRequest: `
    INSERT INTO user_connections (user_id, connected_user_id, status)
    VALUES ($1, $2, 'pending')
    ON CONFLICT (user_id, connected_user_id) DO NOTHING
    RETURNING *;
  `,

  // Accept Circle request (update status to accepted)
  acceptCircleRequest: `
    UPDATE user_connections
    SET status = 'accepted', updated_at = NOW()
    WHERE id = $1 AND connected_user_id = $2 AND status = 'pending'
    RETURNING *;
  `,

  // Create mutual connection after acceptance
  createMutualConnection: `
    INSERT INTO user_connections (user_id, connected_user_id, status)
    VALUES ($1, $2, 'accepted')
    ON CONFLICT (user_id, connected_user_id) DO NOTHING
    RETURNING *;
  `,

  // Reject Circle request
  rejectCircleRequest: `
    UPDATE user_connections
    SET status = 'rejected', updated_at = NOW()
    WHERE id = $1 AND connected_user_id = $2 AND status = 'pending'
    RETURNING *;
  `,

  // Remove from Circle
  removeFromCircle: `
    DELETE FROM user_connections
    WHERE (user_id = $1 AND connected_user_id = $2 AND status = 'accepted')
       OR (user_id = $2 AND connected_user_id = $1 AND status = 'accepted');
  `,

  // Get Circle members (only accepted connections)
  getCircleMembers: `
    SELECT u.id, u.username, u.avatar, uc.updated_at as connected_at
    FROM user_connections uc
    JOIN users u ON uc.connected_user_id = u.id
    WHERE uc.user_id = $1 AND uc.status = 'accepted'
    ORDER BY uc.updated_at DESC
    LIMIT $2 OFFSET $3;
  `,

  // Get Circle count
  getCircleCount: `
    SELECT COUNT(*) as total FROM user_connections
    WHERE user_id = $1 AND status = 'accepted';
  `,

  // Check if user is in Circle
  isInCircle: `
    SELECT EXISTS(
      SELECT 1 FROM user_connections
      WHERE user_id = $1 AND connected_user_id = $2 AND status = 'accepted'
    );
  `,

  // Get pending Circle requests (requests received by user)
  getPendingRequests: `
    SELECT uc.*, u.username, u.avatar
    FROM user_connections uc
    JOIN users u ON uc.user_id = u.id
    WHERE uc.connected_user_id = $1 AND uc.status = 'pending'
    ORDER BY uc.created_at DESC;
  `,

  // Get sent Circle requests
  getSentRequests: `
    SELECT uc.*, u.username, u.avatar
    FROM user_connections uc
    JOIN users u ON uc.connected_user_id = u.id
    WHERE uc.user_id = $1 AND uc.status = 'pending'
    ORDER BY uc.created_at DESC;
  `,

  // Check if there's a pending request
  hasPendingRequest: `
    SELECT EXISTS(
      SELECT 1 FROM user_connections
      WHERE (user_id = $1 AND connected_user_id = $2 AND status = 'pending')
         OR (user_id = $2 AND connected_user_id = $1 AND status = 'pending')
    );
  `,

  // Get request by ID
  getRequestById: `
    SELECT * FROM user_connections WHERE id = $1 AND connected_user_id = $2;
  `,
};
