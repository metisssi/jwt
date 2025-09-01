const UserModel = require('../models/user-model')
const bcrypt = require('bcrypt')
const uuid = require('uuid')
const mailService = require('./mail-service')
const tokenService = require('./token-service')
const UserDto = require('../dtos/user-dto')
const ApiError = require('../exceptions/api-error')

class UserService {
    async registration(email, password) {
        try {
            console.log('🔄 Starting registration for:', email)
            
            const candidate = await UserModel.findOne({ email })
            if (candidate) {
                console.log('❌ User already exists:', email)
                throw ApiError.BadRequest(`User with that email ${email} already exists`)
            }

            console.log('🔐 Hashing password...')
            const hashPassword = await bcrypt.hash(password, 3)
            
            console.log('🔗 Generating activation link...')
            const activationLink = uuid.v4()

            console.log('💾 Creating user in database...')
            const user = await UserModel.create({ 
                email, 
                password: hashPassword, 
                activationLink 
            })
            console.log('✅ User created:', user._id)

            console.log('📧 Sending activation email...')
            try {
                await mailService.sendActivationMail(email, `${process.env.API_URL}/api/activate/${activationLink}`)
                console.log('✅ Email sent successfully')
            } catch (emailError) {
                console.log('⚠️ Email sending failed:', emailError.message)
                // Не блокируем регистрацию из-за проблем с email
            }

            console.log('🎫 Generating tokens...')
            const userDto = new UserDto(user)
            const tokens = tokenService.generateTokens({ ...userDto })
            
            console.log('💾 Saving refresh token...')
            await tokenService.saveToken(userDto.id, tokens.refreshToken)

            console.log('✅ Registration successful for:', email)
            return {
                ...tokens, 
                user: userDto
            }

        } catch (error) {
            console.error('💥 Registration error:', error)
            throw error
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

    async refresh (refreshToken) {
        if(!refreshToken){
            throw ApiError.UnauthorizedError();
        };

        const userData = tokenService.validateRefreshToken(refreshToken);
        const tokenFromDb = await tokenService.findToken(refreshToken)
        if(!userData || !tokenFromDb) {
            throw ApiError.UnauthorizedError()
        }

        const user = await UserModel.findById(userData.id)
        const userDto = new UserDto(user);
        const tokens = tokenService.generateTokens({ ...userDto })

        await tokenService.saveToken(userDto.id, tokens.refreshToken)
        return {
            ...tokens, user: userDto
        }
    }

    async getAllUser () {
        const users = await UserModel.find(); 
        return users; 
    }
}

module.exports = new UserService(); 