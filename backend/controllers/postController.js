import sharp from "sharp";
import cloudinary from "../utils/cloudinary.js";
import {Post} from "../models/postmodel.js";
import { populate } from "dotenv";
import { User } from "../models/usermodel.js";
import { Comment } from "../models/commentmodel.js";
import { getReceiverSocketId, io } from "../socket/socket.js";

export const addNewPost = async(req,res)=>{
    try{
        const {caption} = req.body;
        const image = req.file;
        const authorId = req.id;
        if(!image) return res.status(400).json({message:"Image required"});

        //image upload
        const optimizedImageBuffer = await sharp(image.buffer)
        .resize({height:800,width:800,fit:'inside'})
        .toFormat('jpeg',{quality:80})
        .toBuffer();

        const fileUri = `data:image/jpeg;base64,${optimizedImageBuffer.toString('base64')}`;
        const cloudResponse = await cloudinary.uploader.upload(fileUri);
        const post = await Post.create({
            caption,
            image:cloudResponse.secure_url,
            author:authorId
        })
        
        const user = await User.findById(authorId);
        if(user){
            user.posts.push(post._id);
            await user.save();
        }
        await post.populate({path:'author',select:'-password'});
        res.status(201).json({post,message:"Post created successfully",success:true});

        }catch(error){
        console.log(error);
        
    }
}

export const getAllPosts = async(req,res)=>{
    try{
        const posts = await Post.find().sort({createdAt:-1})
        .populate({path:'author',select:'username profilePicture'})
        .populate({
            path:'comments',
            sort:{createdAt:-1},
            populate:{path:'author',select:'username profilePicture'}

        })

        return res.status(200).json({
           posts,
           success:true 
        })
   
    }catch(error){
        console.log(error);
        
    }
}

export const getUserPost = async(req,res)=>{
    try{
        const authorId = req.id;
        const posts = await Post.find({author:authorId}).sort({createdAt:-1})
                                                        .populate({
                                                            path:'author',
                                                            select:'username,profilePicture'
                                                        }).populate({
                                                            path:'comments',
                                                            sort:{createdAt:-1},
                                                            populate:{path:'author',
                                                            select:'username,profilePicture'}
                                                        })
                                                        return res.status(200).json({
                                                            posts,
                                                            success:true
                                                        })
    }catch(error){
        console.log(error);
        
    }
}

export const likePost = async(req,res)=>{
    try{
        const likedUsersId = req.id;
        const postId = req.params.id;
        const post = await Post.findById(postId);

        if(!post) return res.status(404).json({message:"Post not found",success:false})

            // like logic
            await post.updateOne({$addToSet:{likes:likedUsersId}});
            await post.save();

            // Implement socket io for real time notification
            const user = await User.findById(likedUsersId).select('username profilePicture')
            const postOwnerId = post.author.toString();

            console.log('Like notification - Post owner:', postOwnerId);
            console.log('Like notification - Current user:', likedUsersId);

            if(postOwnerId!==likedUsersId){
                // Emit a notification event
                const notification = {
                    type:'like',
                    userId:likedUsersId,
                    userDetails:user,
                    postId,
                    message:'Your post is liked',
                    timestamp: new Date()
                }

                const receiverSocketId = getReceiverSocketId(postOwnerId);
                console.log('Receiver socket ID:', receiverSocketId);
    
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit('notification', notification);
                    console.log('Notification sent successfully');
                } else {
                    console.log('User is not currently online');
                }
            }

            return res.status(200).json({message:'Post liked',success:true})
    }catch(error){
        console.log(error);
        return res.status(500).json({message: "Internal server error", success: false});
    }
}

export const dislikePost = async(req,res)=>{
    try{
        const likedUsersId = req.id;
        const postId = req.params.id;
        const post = await Post.findById(postId);
        if(!post) return res.status(404).json({message:"Post not found",success:false})

            // like logic
            await post.updateOne({$pull:{likes:likedUsersId}});
            await post.save();

            // Implement socket io for real time notification
            const user = await User.findById(likedUsersId).select('username profilePicture')
            const postOwnerId = post.author.toString();
            if(postOwnerId!==likedUsersId){
                // Emit a notification event
                const notification = {
                    type:'dislike',
                    userId:likedUsersId,
                    userDetails:user,
                    postId,
                    message:'Your post is disliked'
                }
                const postOwnerSocketId = getReceiverSocketId(postOwnerId);
console.log("Post Owner ID:", postOwnerId);
console.log("Post Owner Socket ID:", postOwnerSocketId);
console.log("Notification to emit:", notification);

if (postOwnerSocketId) {
    io.to(postOwnerSocketId).emit("notification", notification);
} else {
    console.log("Post Owner Socket ID is undefined or invalid");
}

            }


            return res.status(200).json({message:'Post disliked',success:true})
    }catch(error){
        console.log(error);
        
    }
}

export const addComment = async(req,res)=>{
    try{
        const postId = req.params.id;
        const commentUserId = req.id;
        const {text}= req.body;
        const post = await Post.findById(postId);
        if(!text) return res.status(400).json({message:"No comments found.",success:false});
        const comment = await Comment.create({
            text,
            author:commentUserId,
            post:postId
        })
        await comment.populate({
            path:"author",
            select:"username profilePicture"
        });
        post.comments.push(comment._id);
        await post.save();
        return res.status(201).json({message:"Comment added",success:true})

    }catch(error){
        console.log(error);
        
    }
}
export const getCommentOfPost = async(req,res)=>{
try{
    const postId = req.params.id;
    const comments = await Comment.find({post:postId}).populate('author','username profilePicture');
    if(!comments) return res.status(404).json({message:"No comments found",success:false})

            return res.status(200).json({success:true,comments});
}catch(error){
console.log(error);
}
}

export const deletePost = async(req,res)=>{
    try{
        const postId= req.params.id;
        const authorId = req.id;

        const post = await Post.findById(postId);
        if(!post) return res.status(404).json({message:"Post not found",success:false})

            //check if the logged user is the author of the post
            if(post.author.toString() !== authorId) return res.status(403).json({message:"Unauthorized author"})
                //delete post
            await Post.findByIdAndDelete(postId);
            //remove the postId from the user's post
            let user = await User.findById(authorId);
            user.posts = user.posts.filter(id=>id.toString()!=postId);
            await user.save();

            //delete associated comments

    await Comment.deleteMany({post:postId})
    return res.status(200).json({
        message :"Post deleted" ,
        success:true})

    }catch(error){
        console.log(error);
        
    }
}

export const bookmarkPost =async(req,res)=>{
    try{
        const postId = req.params.id;
        const authorId = req.id;
        const post = await Post.findById(postId);

        if(!post) return res.status(404).json({
            message:'Post not found',
            success:false
        })

        const user = await User.findById(authorId);
        if(user.bookmarks.includes(post._id)){
            //remove already bookmarked posts
            await user.updateOne({$pull:{bookmarks:post._id}})
            await user.save();
            return res.status(200).json({
                type:"unsaved",
                message:'Post removed from bookmark',
                success:true
            })
        }else{
            //do bookmark
            await user.updateOne({$addToSet:{bookmarks:post._id}})
            await user.save();
            return res.status(200).json({
                type:"saved",
                message:'Post bookmarked',
                success:true
            })

        }
    }catch(error){
        console.log(error);
        
    }
}


