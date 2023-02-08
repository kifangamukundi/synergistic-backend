import bcrypt from 'bcryptjs';

const data = {
  users: [
    {
      firstName: 'Root',
      lastName: 'Admin',
      mobileNumber: '0702817040',
      email: 'mukundikifanga@gmail.com',
      image: '/images/p1.jpg',
      password: bcrypt.hashSync('64GB1995'),
      isActive: true,
      isAdmin: true,
      isModerator: true,
      isFieldAgent: true,
      isFarmer: true,
    },
    {
      firstName: 'Test',
      lastName: 'User',
      mobileNumber: '0797188219', // Ian
      email: 'pkmymcmbnhs@gmail.com',
      image: '/images/p1.jpg',
      password: bcrypt.hashSync('64GB1995'),
      isActive: true,
      isAdmin: false,
      isModerator: false,
      isFieldAgent: false,
      isFarmer: true,
    },
  ],
};
export default data;
