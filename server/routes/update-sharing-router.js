const router = require("express").Router();
const { google } = require('googleapis');
const UserProfile = require('../models/UserProfile');
const refresh = require('passport-oauth2-refresh');

async function sendUserProfile(res, userProfile) {
    // Make a copy of user profile object before sending to client
    const profile = JSON.parse(JSON.stringify(userProfile));
    // No need to send token data to front-end
    profile.user.tokens = undefined;
    return res.status(200).json({success: true, profile: profile});
}

router.post('/addpermission', async (req, res) => {
    if(!req.user) return res.status(401).json({success: false, message: "Error"});

    UserProfile.findById(req.user._id, async (err, userProfile) => {
        if(err) console.log(err);
        if(err || !userProfile) return res.status(500).json({success: false, message: "Error"});
        const { files, type, role, value } = req.body;

        if(!files || !type || !role) return res.status(400).json({success: false, message: "Invalid data format"});
        if(files.length == 0) return res.status(400).json({success: false, message: "No files specified"});
        if(userProfile.fileSharingSnapshots.length == 0) return res.status(400).json({success: false, message: "No file-sharing snapshot in user profile"});
        if(userProfile.user.driveType === "google") {
            if((type === "user" || type === "group" || type === "domain") && !value) return res.status(400).json({success: false, message: "Invalid data format"});
            if(type !== "user" && type !== "group" && type !== "domain" && type !== "anyone") return res.status(400).json({success: false, message: "Invalid type"});
            if(role !== "writer" && role !== "reader" && role !== "commenter") return res.status(400).json({success: false, message: "Invalid role"});
            // Make sure to refresh access token before attempting to access Google Drive API
            if(userProfile.user.tokens.refresh_token) {
                refresh.requestNewAccessToken(
                    'google',
                    userProfile.user.tokens.refresh_token,
                    function (err, accessToken, refreshToken) {
                        // Store new tokens in database
                        userProfile.user.tokens.access_token = accessToken;
                        userProfile.user.tokens.refresh_token = refreshToken;
                        userProfile.save();
                    },
                );
            }
            const oAuth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID,
                process.env.GOOGLE_CLIENT_SECRET, process.env.CLIENT_URL);
            
            oAuth2Client.setCredentials(userProfile.user.tokens);
            // Create Google Drive object to call API
            const googleDrive = google.drive({
                version: 'v3',
                auth: oAuth2Client
            });
            try {
                for(const file of files) {
                    // A user is only authorized to make permission requests for files that include a permissions array
                    if(file.permissions) {
                        // If permission of same {type, role, value} is not present in file.permissions,
                        // then make an API call to add new permission for file
                        let present = false;
                        for(const permission of file.permissions) {
                            if(permission.type === type && permission.role === role) {
                                if((permission.type === "user" || permission.type === "group") && permission.emailAddress.toLowerCase() === value.toLowerCase()) {
                                    present = true;
                                }
                                else if(permission.type === "domain" && permission.domain.toLowerCase() === value.toLowerCase()) {
                                    present = true;
                                }
                                else if(permission.type === "anyone") present = true;
                            }
                        }
                        if(!present) {
                            if(type === "user" || type === "group") {
                                await googleDrive.permissions.create({
                                    fileId: file.id,
                                    supportsAllDrives: true,
                                    requestBody: {
                                        role: role,
                                        type: type,
                                        emailAddress: value.toLowerCase()
                                    }
                                });
                            }
                            else if(type === "domain") {
                                await googleDrive.permissions.create({
                                    fileId: file.id,
                                    supportsAllDrives: true,
                                    requestBody: {
                                        role: role,
                                        type: type,
                                        domain: value.toLowerCase()
                                    }
                                });
                            }
                            else if(type === "anyone") {
                                await googleDrive.permissions.create({
                                    fileId: file.id,
                                    supportsAllDrives: true,
                                    requestBody: {
                                        role: role,
                                        type: type
                                    }
                                });
                            }
                            let updatedPermissions = await getPermissionsGoogle(googleDrive, file.id);
                            // Find file in most recent file-sharing snapshot and update its permissions
                            userProfile.fileSharingSnapshots[userProfile.fileSharingSnapshots.length - 1].data.forEach((f, index) => {
                                if(f.id === file.id)
                                    userProfile.fileSharingSnapshots[userProfile.fileSharingSnapshots.length - 1].data[index].permissions = updatedPermissions;
                            });
                            if(file.mimeType === 'application/vnd.google-apps.folder' && file.path) {
                                // If file is a folder, get IDs of all files under it, make API calls to get permissions for each file,
                                // and update each file's permissions
                                let fileIds = getFilesIdsUnderFolder(userProfile.fileSharingSnapshots[userProfile.fileSharingSnapshots.length - 1].data, file.path + '/' + file.name, file.id);
                                for(const id of fileIds) {
                                    updatedPermissions = await getPermissionsGoogle(googleDrive, id);
                                    // Find file in most recent file-sharing snapshot and update its permissions
                                    userProfile.fileSharingSnapshots[userProfile.fileSharingSnapshots.length - 1].data.forEach((f, index) => {
                                        if(f.id === id)
                                            userProfile.fileSharingSnapshots[userProfile.fileSharingSnapshots.length - 1].data[index].permissions = updatedPermissions;
                                    });
                                }
                            }
                        }
                    }
                }
                // Log sharing changes
                userProfile.sharingChangesLog.push({
                    files: files,
                    permissionType: type,
                    permissionRole: role,
                    permissionValue: value,
                    action: 'add'
                });
            } catch(err) {
                console.log(err);
                return res.status(500).json({success: false, message: "Error"});
            }
        }
        // TODO
        else if(userProfile.user.driveType === "microsoft") {
        }
        // Save to database
        try {
            await userProfile.save();
        } catch(err) {
            console.log(err);
            return res.status(500).json({success: false, message: "Error"});
        }
        return sendUserProfile(res, userProfile);
    });
});

router.post('/removepermission', async (req, res) => {
    if(!req.user) return res.status(401).json({success: false, message: "Error"});

    UserProfile.findById(req.user._id, async (err, userProfile) => {
        if(err) console.log(err);
        if(err || !userProfile) return res.status(500).json({success: false, message: "Error"});
        const { files, type, role, value } = req.body;

        if(!files || !type || !role) return res.status(400).json({success: false, message: "Invalid data format"});
        if(files.length == 0) return res.status(400).json({success: false, message: "No files specified"});
        if(userProfile.fileSharingSnapshots.length == 0) return res.status(400).json({success: false, message: "No file-sharing snapshot in user profile"});
        if(userProfile.user.driveType === "google") {
            if((type === "user" || type === "group" || type === "domain") && !value) return res.status(400).json({success: false, message: "Invalid data format"});
            if(type !== "user" && type !== "group" && type !== "domain" && type !== "anyone") return res.status(400).json({success: false, message: "Invalid type"});
            if(role !== "writer" && role !== "reader" && role !== "commenter") return res.status(400).json({success: false, message: "Invalid role"});
            // Make sure to refresh access token before attempting to access Google Drive API
            if(userProfile.user.tokens.refresh_token) {
                refresh.requestNewAccessToken(
                    'google',
                    userProfile.user.tokens.refresh_token,
                    function (err, accessToken, refreshToken) {
                        // Store new tokens in database
                        userProfile.user.tokens.access_token = accessToken;
                        userProfile.user.tokens.refresh_token = refreshToken;
                        userProfile.save();
                    },
                );
            }
            const oAuth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID,
                process.env.GOOGLE_CLIENT_SECRET, process.env.CLIENT_URL);
            
            oAuth2Client.setCredentials(userProfile.user.tokens);
            // Create Google Drive object to call API
            const googleDrive = google.drive({
                version: 'v3',
                auth: oAuth2Client
            });
            try {
                for(const file of files) {
                    // A user is only authorized to make permission requests for files that include a permissions array
                    if(file.permissions) {
                        // If permission of same {type, role, value} is present in file.permissions,
                        // then make an API call to remove permission for file
                        let present = false;
                        for(const permission of file.permissions) {
                            if(permission.type === type && permission.role === role) {
                                if((permission.type === "user" || permission.type === "group") && permission.emailAddress.toLowerCase() === value.toLowerCase()) {
                                    await googleDrive.permissions.delete({
                                        fileId: file.id,
                                        permissionId: permission.id,
                                        supportsAllDrives: true
                                    });
                                    present = true;
                                }
                                else if(permission.type === "domain" && permission.domain.toLowerCase() === value.toLowerCase()) {
                                    await googleDrive.permissions.delete({
                                        fileId: file.id,
                                        permissionId: permission.id,
                                        supportsAllDrives: true
                                    });
                                    present = true;
                                }
                                else if(permission.type === "anyone") {
                                    await googleDrive.permissions.delete({
                                        fileId: file.id,
                                        permissionId: permission.id,
                                        supportsAllDrives: true
                                    });
                                    present = true;
                                }
                            }
                        }
                        if(present) {
                            let updatedPermissions = await getPermissionsGoogle(googleDrive, file.id);
                            // Find file in most recent file-sharing snapshot and update its permissions
                            userProfile.fileSharingSnapshots[userProfile.fileSharingSnapshots.length - 1].data.forEach((f, index) => {
                                if(f.id === file.id)
                                    userProfile.fileSharingSnapshots[userProfile.fileSharingSnapshots.length - 1].data[index].permissions = updatedPermissions;
                            });
                            if(file.mimeType === 'application/vnd.google-apps.folder' && file.path) {
                                // If file is a folder, get file IDs of all files under it, make API calls to get permissions for each file,
                                // and update each file's permissions
                                let fileIds = getFilesIdsUnderFolder(userProfile.fileSharingSnapshots[userProfile.fileSharingSnapshots.length - 1].data, file.path + '/' + file.name, file.id);
                                for(const id of fileIds) {
                                    updatedPermissions = await getPermissionsGoogle(googleDrive, id);
                                    // Find file in most recent file-sharing snapshot and update its permissions
                                    userProfile.fileSharingSnapshots[userProfile.fileSharingSnapshots.length - 1].data.forEach((f, index) => {
                                        if(f.id === id)
                                            userProfile.fileSharingSnapshots[userProfile.fileSharingSnapshots.length - 1].data[index].permissions = updatedPermissions;
                                    });
                                }
                            }
                        }
                    }
                }
                // Log sharing changes
                userProfile.sharingChangesLog.push({
                    files: files,
                    permissionType: type,
                    permissionRole: role,
                    permissionValue: value,
                    action: 'remove'
                });
            } catch(err) {
                console.log(err);
                return res.status(500).json({success: false, message: "Error"});
            }
        }
        // TODO
        else if(userProfile.user.driveType === "microsoft") {
        }
        // Save to database
        try {
            await userProfile.save();
        } catch(err) {
            console.log(err);
            return res.status(500).json({success: false, message: "Error"});
        }
        return sendUserProfile(res, userProfile);
    });
});

router.post('/unsharefiles', async (req, res) => {
    // Note: Front-end should only send files in MyDrive
    if(!req.user) return res.status(401).json({success: false, message: "Error"});

    UserProfile.findById(req.user._id, async (err, userProfile) => {
        if(err) console.log(err);
        if(err || !userProfile) return res.status(500).json({success: false, message: "Error"});
        const { files } = req.body;

        if(!files) return res.status(400).json({success: false, message: "Invalid data format"});
        if(files.length == 0) return res.status(400).json({success: false, message: "No files specified"});
        if(userProfile.fileSharingSnapshots.length == 0) return res.status(400).json({success: false, message: "No file-sharing snapshot in user profile"});
        if(userProfile.user.driveType === "google") {
            // Make sure to refresh access token before attempting to access Google Drive API
            if(userProfile.user.tokens.refresh_token) {
                refresh.requestNewAccessToken(
                    'google',
                    userProfile.user.tokens.refresh_token,
                    function (err, accessToken, refreshToken) {
                        // Store new tokens in database
                        userProfile.user.tokens.access_token = accessToken;
                        userProfile.user.tokens.refresh_token = refreshToken;
                        userProfile.save();
                    },
                );
            }
            const oAuth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID,
                process.env.GOOGLE_CLIENT_SECRET, process.env.CLIENT_URL);
            
            oAuth2Client.setCredentials(userProfile.user.tokens);
            // Create Google Drive object to call API
            const googleDrive = google.drive({
                version: 'v3',
                auth: oAuth2Client
            });
            try {
                for(const file of files) {
                    // A user is only authorized to make permission requests for files that include a permissions array
                    if(file.permissions) {
                        // If permission has a non-"owner" role in file.permissions (i.e., file is shared),
                        // then make an API call to remove permission for file
                        let shared = false;
                        for(const permission of file.permissions) {
                            if(permission.role !== "owner") {
                                await googleDrive.permissions.delete({
                                    fileId: file.id,
                                    permissionId: permission.id
                                });
                                shared = true;
                            }
                        }
                        if(shared) {
                            let updatedPermissions = await getPermissionsGoogle(googleDrive, file.id);
                            // Find file in most recent file-sharing snapshot and update its permissions
                            userProfile.fileSharingSnapshots[userProfile.fileSharingSnapshots.length - 1].data.forEach((f, index) => {
                                if(f.id === file.id)
                                    userProfile.fileSharingSnapshots[userProfile.fileSharingSnapshots.length - 1].data[index].permissions = updatedPermissions;
                            });
                            if(file.mimeType === 'application/vnd.google-apps.folder' && file.path) {
                                // If file is a folder, get file IDs of all files under it, make API calls to get permissions for each file,
                                // and update each file's permissions
                                let fileIds = getFilesIdsUnderFolder(userProfile.fileSharingSnapshots[userProfile.fileSharingSnapshots.length - 1].data, file.path + '/' + file.name, file.id);
                                for(const id of fileIds) {
                                    updatedPermissions = await getPermissionsGoogle(googleDrive, id);
                                    // Find file in most recent file-sharing snapshot and update its permissions
                                    userProfile.fileSharingSnapshots[userProfile.fileSharingSnapshots.length - 1].data.forEach((f, index) => {
                                        if(f.id === id)
                                            userProfile.fileSharingSnapshots[userProfile.fileSharingSnapshots.length - 1].data[index].permissions = updatedPermissions;
                                    });
                                }
                            }
                        }
                    }
                }
                // Log sharing changes
                userProfile.sharingChangesLog.push({
                    files: files,
                    permissionType: 'n/a',
                    permissionRole: 'n/a',
                    permissionValue: 'n/a',
                    action: 'unshare'
                });
            } catch(err) {
                console.log(err);
                return res.status(500).json({success: false, message: "Error"});
            }
        }
        // TODO
        else if(userProfile.user.driveType === "microsoft") {
        }
        // Save to database
        try {
            await userProfile.save();
        } catch(err) {
            console.log(err);
            return res.status(500).json({success: false, message: "Error"});
        }
        return sendUserProfile(res, userProfile);
    });
});

router.get('/checksnapshotconsistency', async (req, res) => {
    // Check consistency of files and permissions between
    // cloud drive and most recent file-sharing snapshot
    if(!req.user) return res.status(401).json({success: false, message: "Error"});

    UserProfile.findById(req.user._id, async (err, userProfile) => {
        if(err) console.log(err);
        if(err || !userProfile) return res.status(500).json({success: false, message: "Error"});
        if(userProfile.fileSharingSnapshots.length == 0) return res.status(400).json({success: false, message: "No file-sharing snapshot in user profile"});
        if(userProfile.user.driveType === "google") {
            // Make sure to refresh access token before attempting to access Google Drive API
            if(userProfile.user.tokens.refresh_token) {
                refresh.requestNewAccessToken(
                    'google',
                    userProfile.user.tokens.refresh_token,
                    function (err, accessToken, refreshToken) {
                        // Store new tokens in database
                        userProfile.user.tokens.access_token = accessToken;
                        userProfile.user.tokens.refresh_token = refreshToken;
                        userProfile.save();
                    },
                );
            }
            const oAuth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID,
                process.env.GOOGLE_CLIENT_SECRET, process.env.CLIENT_URL);
            
            oAuth2Client.setCredentials(userProfile.user.tokens);
            // Create Google Drive object to call API
            const googleDrive = google.drive({
                version: 'v3',
                auth: oAuth2Client
            });
            try {
                // Check whether files in the most recent file-sharing snapshot exist in Google Drive
                for(const file of userProfile.fileSharingSnapshots[userProfile.fileSharingSnapshots.length - 1].data) {
                    await googleDrive.files.get({
                        fileId: file.id,
                        supportsAllDrives: true
                    });
                }
            } catch(err) {
                console.log(err);
                return res.status(200).json({success: false, message: "The most recent file-sharing snapshot is inconsistent (i.e., not up-to-date) with Google Drive! Please take a new file-sharing snapshot."});
            }
            try {
                // Check whether file permissions match the permissions in Google Drive
                for(const file of userProfile.fileSharingSnapshots[userProfile.fileSharingSnapshots.length - 1].data) {
                    if(file.permissions) {
                        let drivePermissions = await getPermissionsGoogle(googleDrive, file.id);
                        let drivePermissionsIds = new Set(drivePermissions.map(p => p.id));
                        let snapshotPermissionIds = new Set(file.permissions.map(p => p.id));
                        if(!setsEqual(drivePermissionsIds, snapshotPermissionIds))
                            return res.status(200).json({success: false, message: "The most recent file-sharing snapshot is inconsistent (i.e., not up-to-date) with Google Drive! Please take a new file-sharing snapshot."});
                    }
                }
                return res.status(200).json({success: true, message: "The most recent file-sharing snapshot is consistent (i.e., up-to-date) with Google Drive."});
            } catch(err) {
                console.log(err);
                return res.status(500).json({success: false, message: "Error"});
            }
        }
        // TODO
        else if(userProfile.user.driveType === "microsoft") {
        }
    });
});

function getFilesIdsUnderFolder(snapshot, path, id) {
    let fileIds = [];
    if(!path) return fileIds;
    for(const file of snapshot) {
        if(file.path && file.path.startsWith(path) && file.id !== id) {
            fileIds.push(file.id);
        }
    }
    return fileIds;
}

async function getPermissionsGoogle(googleDrive, id) {
    // Make API calls to get all permissions for file
    let updatedPermissions = [];
    let permissionsList = [];
    let NextPageToken = "";
    do {
        let p = {
            fileId: id,
            supportsAllDrives: true,
            pageSize: 100
        };
        if(NextPageToken) {
            p = {
                fileId: id,
                supportsAllDrives: true,
                pageSize: 100,
                pageToken: NextPageToken
            };
        }
        let permissionsResponse = await googleDrive.permissions.list(p);
        permissionsList = permissionsList.concat(permissionsResponse.data.permissions);
        NextPageToken = permissionsResponse.data.nextPageToken;
    } while(NextPageToken);

    // Map each permission to its associated metadata (by making an API call per permission)
    updatedPermissions = await Promise.all(permissionsList.map(async (permission) => {
        let resp = await googleDrive.permissions.get({
            fileId: id,
            permissionId: permission.id,
            supportsAllDrives: true,
            fields: "*"
        });
        return resp.data;
    }));
    return updatedPermissions;
}

function setsEqual(s1, s2) {
    if (s1.size != s2.size) return false;
    for (const element of s1) {
        if (!s2.has(element)) return false;
    }
    return true;
}

module.exports = router;