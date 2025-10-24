import { ImageSourcePropType } from 'react-native';

// Available avatar assets
const AVATAR_ASSETS = [
  require('@/assets/images/avatars/bear.png'),
  require('@/assets/images/avatars/chicken.png'),
  require('@/assets/images/avatars/dog (1).png'),
  require('@/assets/images/avatars/dog.png'),
  require('@/assets/images/avatars/jaguar.png'),
  require('@/assets/images/avatars/rabbit.png'),
  require('@/assets/images/avatars/sea-lion.png'),
];

/**
 * Get a random avatar for a user based on their ID
 * This ensures the same user always gets the same avatar
 */
export function getUserAvatar(userId: string): ImageSourcePropType {
  // Use the user ID to generate a consistent "random" selection
  const hash = userId.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);
  
  const index = hash % AVATAR_ASSETS.length;
  return AVATAR_ASSETS[index];
}

/**
 * Get avatar source for a user - either their custom avatar or a random one
 */
export function getAvatarSource(userId: string, avatarUrl?: string): ImageSourcePropType {
  // If user has a custom avatar URL, use it
  if (avatarUrl && avatarUrl.trim() !== '') {
    return { uri: avatarUrl };
  }
  
  // Otherwise, use a random avatar based on user ID
  return getUserAvatar(userId);
}

/**
 * Get a random avatar (for new users or when no user ID is available)
 */
export function getRandomAvatar(): ImageSourcePropType {
  const randomIndex = Math.floor(Math.random() * AVATAR_ASSETS.length);
  return AVATAR_ASSETS[randomIndex];
}
