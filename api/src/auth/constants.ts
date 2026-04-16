const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
    throw new Error("JWT_SECRET is not defined");
}

export const jwtConstants = {
    secret: jwtSecret,
    signOptions : {
        expiresIn: 14400 // time in seconds
    },
};