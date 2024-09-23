import { User } from "../models/usermodel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cloudinary from "../utils/cloudinary.js";
import getDataUri from '../utils/datauri.js';
import {Post} from '../models/postmodel.js';



export const register = async(req,res)=> {
    try{
        const{username,email,password}= req.body;
        if(!username || !email || !password){
            return res.status(401).json({
                message:"All fields are required",
                success:false,
            });
        }

        const user = await User.findOne({email});
        if(user){
            return res.status(401).json({
                message:"Email already registered",
                success:false,
            });
        }

        const hashedPassword = await bcrypt.hash(password,10)
        await User.create({
            username,
            email,
            password:hashedPassword
        });

        return res.status(201).json({
            message:"Account created successfully.",
            success:true,
        })

    }catch(error){
        console.log(error);
        
    }
}

export const login = async(req,res)=> {
    try{

        const {email,password}= req.body;

        if(!email || !password){
            return res.status(401).json({
                message:"Username or Password incorrect.",
                success:false,
            })
        }

        let user = await User.findOne({email})
        if(!user){
            return res.status(401).json({
                message:"Incorrect email or password.",
                success:false,
            })
        }

        const isPasswordMatch = await bcrypt.compare(password,user.password)
        if(!isPasswordMatch){
            return res.status(401).json({
                message:"Incorrect email or password.",
                success:false,
            })
        }

        const token = await jwt.sign({userId:user._id},process.env.SECRET_KEY,{expiresIn:'1d'});

        //populate each post if in the post array
        const populatedPosts = await Promise.all(
            user.posts.map(async(postId)=>{
                const post = await Post.findById(postId);
                if(post.author.equals(user._id)){
                    return post;
                }
                return null;
            })
        )

        user={
            _id:user._id,
            username:user.username,
            email:user.email,
            profilePicture:user.profilePicture,
            bio:user.bio,
            gender:user.gender,
            followers:user.followers,
            following:user.following,
            posts:populatedPosts
        }

       
        return res.cookie('token',token,{httpOnly:true,sameSite:'strict',maxAge:1*24*60*60*1000}).json({
            message:`Welcome back ${user.username}`,
            success:true,
            user
        })

        }catch(error){
        console.log(error);
        
    }
}

export const logout = async(_,res)=>{
    try{
       return res.cookie("token","",{maxAge:0}).json({
        message:"Logged out successfully",
        success:true
       }) 
    }catch{
        console.log(error);
        
    }
}

export const getProfile = async(req,res)=>{
    try{
        const userId = req.params.id;
        let user = await User.findById(userId).select('-password');
        return res.status(200).json({
            user,
            success:true
        })
    }catch{
        console.log(error);
        
    }
}

export const editProfile = async(req, res) => {
    try {
        const userId = req.id;
        const { bio, gender } = req.body;
        const profilePicture = req.file;
        

        let cloudResponse;
        if(profilePicture){
            const fileUri = getDataUri(profilePicture);
            cloudResponse = await cloudinary.uploader.upload(fileUri);
         
        }

        const user = await User.findById(userId).select('-password');
      

        if(!user){
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }

        if(bio) user.bio = bio;
        if(gender) user.gender = gender;
        if(profilePicture) user.profilePicture = cloudResponse.secure_url;

        await user.save();
        console.log("User profile updated successfully");

        return res.status(200).json({
            message: "Profile updated successfully",
            success: true,
            user
        });

    } catch (error) {
        console.error("Error in editProfile:", error.message);
        res.status(500).json({
            message: "Internal Server Error",
            success: false
        });
    }
};


export const getSuggestedUsers = async(req,res)=>{
    try{
        const suggestedUsers = await User.find({_id:{$ne:req.id}}).select("-password")
        if(!suggestedUsers){
            return res.status(400).json({
                message:"No suggested users found",
                success:false
            })
        }
        return res.status(200).json({
            success:true,
            users:suggestedUsers
        })
    }catch(error){
        console.log(error);
        
    }
}

export const followOrUnfollow = async(req,res)=>{
    try{
        const follower = req.id;
        const userToFollow = req.params.id;

        // Check if the user is trying to follow/unfollow themselves
        if(follower === userToFollow){
            return res.status(400).json({
                message:"You cannot follow/unfollow yourself",
                success:false
            })
        }

        const user = await User.findById(follower);
        const targetUser = await User.findById(userToFollow);

        if(!user || !targetUser){
            return res.status(400).json({
                message:"User not found",
                success:false
            });
        }

        //checking whether to follow or unfollow

        const isFollowing = user.following.includes(userToFollow)
        if(isFollowing){
            //unfollow user

            await Promise.all([
                User.updateOne({_id:follower},{$pull:{following:userToFollow}}),
                User.updateOne({_id:userToFollow},{$pull:{followers:follower}})
            ])
            return res.status(200).json({message:"Unfollowed successfully",success:true})
        }else{
            //follow user
            await Promise.all([
                User.updateOne({_id:follower},{$push:{following:userToFollow}}),
                User.updateOne({_id:userToFollow},{$push:{followers:follower}})
            ])
            return res.status(200).json({message:"Followed successfully", success:true})
        }
        
    }catch (error) {
        console.error("Error in followOrUnfollow:", error.message);
        return res.status(500).json({
            message: "Internal Server Error",
            success: false
        });
    }
}