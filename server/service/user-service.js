const UserModel = require('../models/user-model')
const bcrypt = require('bcrypt')
const uuid = require('uuid')
const mailService = require('./mail-service')
const tokenService = require('./token-service')
const UserDto = require('../dtos/user-dto')
const ApiError = require('../exceptions/api-error')

class UserService {
    async registration(email, password) {
        const candidate = await UserModel.findOne({ email })
        if (candidate) {
            throw ApiError.BadRequest(`User with that email ${email} already exists `)
        }

        const hashPassword = await bcrypt.hash(password, 3)
        const activationLink = uuid.v4() // hash Passwrod


        const user = await UserModel.create({ email, password: hashPassword, activationLink })
        await mailService.sendActivationMail(email, `${process.env.API_URL}/api/activate/${activationLink}`);


        const userDto = new UserDto(user) // id, email, isActivated
        const tokens = tokenService.generateTokens({ ...userDto })
        await tokenService.saveToken(userDto.id, tokens.refreshToken)

        return {
            ...tokens, user: userDto
        }



    }

    async activate(activationLink) {
        const user = await UserModel.findOne({ activationLink })
        console.log(user)

        if (!user) {
            throw ApiError.BadRequest('link incorrect')
        }

        user.isActivated = true
        await user.save();

        const userDto = new UserDto(user)
        const tokens = tokenService.generateTokens({ ...userDto })
        await tokenService.saveToken(userDto.id, tokens.refreshToken)

        return { ...tokens, user: userDto }
    }

    async login(email, password) {
        const user = await UserModel.findOne({ email })
        if (!user) {
            throw ApiError.BadRequest('User with that mail dont find1')
        }
        const isPassEquals = await bcrypt.compare(password, user.password);
        if (!isPassEquals) {
            throw ApiError.BadRequest('Password incorrect')
        }

        const userDto = new UserDto(user);
        const tokens = tokenService.generateTokens({ ...userDto })

        await tokenService.saveToken(userDto.id, tokens.refreshToken)
        return {
            ...tokens, user: userDto
        }

    }


    async logout(refreshToken) {
        const token = await tokenService.removeToken(refreshToken); 
        return token;
    }
}

module.exports = new UserService(); 