import * as React from 'react';
import { styled, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import MuiDrawer from '@mui/material/Drawer';
import MuiAppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import CssBaseline from '@mui/material/CssBaseline';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import InboxIcon from '@mui/icons-material/MoveToInbox';
import MailIcon from '@mui/icons-material/Mail';
import PrimarySearchAppBar from "./Header";
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import RestoreIcon from '@mui/icons-material/Restore';
import BasicModal from "./Modal";
import MultipleSelectPlaceholder from "./DropDownList";
import Stack from '@mui/material/Stack';
import ColorRadioButtons from "./CreateSnapshot";
import Button from "@mui/material/Button";
import {useNavigate} from "react-router-dom";

import SettingsIcon from '@mui/icons-material/Settings';

import CloudIcon from '@mui/icons-material/Cloud';

import InsightsIcon from '@mui/icons-material/Insights';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import PublishedWithChangesIcon from '@mui/icons-material/PublishedWithChanges';
import AddToDriveIcon from '@mui/icons-material/AddToDrive';
import GoogleIcon from '@mui/icons-material/Google';
import PermIdentityIcon from '@mui/icons-material/PermIdentity';
import HomeHeader from "./HomeHeader";
import MultiActionAreaCard from "./Folder";
import SideBarFileInfo from "./SideBarFileInfo";


//This is for the left side bar

const drawerWidth = 240;


const openedMixin = (theme) => ({
    width: drawerWidth,
    transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
    }),
    overflowX: 'hidden',
});

const closedMixin = (theme) => ({
    transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
    overflowX: 'hidden',
    width: `calc(${theme.spacing(7)} + 1px)`,
    [theme.breakpoints.up('sm')]: {
        width: `calc(${theme.spacing(8)} + 1px)`,
    },
});

const DrawerHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: theme.spacing(0, 1),
    // necessary for content to be below app bar
    ...theme.mixins.toolbar,
}));

const AppBar = styled(MuiAppBar, {
    shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(['width', 'margin'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
    ...(open && {
        marginLeft: drawerWidth,
        width: `calc(100% - ${drawerWidth}px)`,
        transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
        }),
    }),
}));

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
    ({ theme, open }) => ({
        width: drawerWidth,
        flexShrink: 0,
        whiteSpace: 'nowrap',
        boxSizing: 'border-box',
        ...(open && {
            ...openedMixin(theme),
            '& .MuiDrawer-paper': openedMixin(theme),
        }),
        ...(!open && {
            ...closedMixin(theme),
            '& .MuiDrawer-paper': closedMixin(theme),
        }),
    }),
);


export default function MiniDrawer({children, ...props}) {
    const navigate = useNavigate()
    const theme = useTheme();
    const [open, setOpen] = React.useState(false);
    const [openModal, setOpenModal] = React.useState(false);
    const handleOpenModal = () => setOpenModal(true);
    const handleCloseModal = () => setOpenModal(false);

    let twoD_Array = new Array(0);
    for (var i = 0; i < props.components.length/4; i++) {
        twoD_Array.push([]);
        if(i == 9){
            break;
        }
    }
    if(props.type === "home"){
        console.log(props.components);
        for(let i =0; i < props.components.length; i+=4){
            for(let j = 0; j < 4; j++){
                if(props.components[i+j] === undefined){
                    break;
                }else{
                    twoD_Array[i/4][j] = props.components[i+j];
                }
            }
            if(i == 40) break;
        }
    }
    console.log(twoD_Array);
    const handleDrawerOpen = () => {
        setOpen(true);
    };

    const handleDrawerClose = () => {
        setOpen(false);
    };
    const navigateAccessControl = () => {
        // 👇️ navigate to /
        navigate('/accessControl')

    };
    const navigateRedundantSharing = () => {
        // 👇️ navigate to /
        navigate('/redundantSharing')

    };
    const navigateDeviantSharing = () => {
        // 👇️ navigate to /
        navigate('/deviantSharing')

    };
    const navigateFileFolderSharing = () => {
        // 👇️ navigate to /
        navigate('/fileFolderSharing')

    };
    const navigateSharingChanges = () => {
        // 👇️ navigate to /
        navigate('/sharingChanges')

    };
    const navigateMyProfile = () =>{
        navigate('/')
    };

    return (
        <Box sx={{ display: 'flex'}}>
            <CssBaseline />
            <AppBar position="fixed" open={open}>
                <Toolbar>
                    <IconButton
                        color="black"
                        aria-label="open drawer"
                        onClick={handleDrawerOpen}
                        edge="start"
                        sx={{
                            marginRight: 0,
                            ...(open && { display: 'none' }),
                        }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <PrimarySearchAppBar userData = {props.userData}/>
                </Toolbar>
            </AppBar>
            <Drawer variant="permanent" open={open}>
                <DrawerHeader>
                    <IconButton onClick={handleDrawerClose}>
                        {theme.direction === 'rtl' ? <ChevronRightIcon /> : <ChevronLeftIcon />}
                    </IconButton>
                </DrawerHeader>
                <Divider />

                <List>
                {['Drive Storage'].map((text, index) => (
                        <ListItem key={text} disablePadding sx={{ display: 'block' }}>
                            <ListItemButton
                                sx={{
                                    minHeight: 48,
                                    justifyContent: open ? 'initial' : 'center',
                                    px: 1.5,
                                    // backgroundColor: open ? "#E1E1E1" : '' , 
                                    backgroundColor: "#E1E1E1" , 
                                }}
                            >
                                <ListItemIcon
                                    sx={{
                                        minWidth: 0,
                                        mr: open ? 3 : 'auto',
                                        justifyContent: 'center',
                                        // opacity: open ? 1 : 0
                                    }}
                                >
                                    <AddToDriveIcon></AddToDriveIcon>
                                </ListItemIcon>
                                <ListItemText primaryTypographyProps={{fontSize: '15px'}}  primary={text} sx={{  opacity: open ? 1 : 0 }} />
                            </ListItemButton>
                        </ListItem>
                    ))}
                    
                    {['Google Drive', 'OneDrive'].map((text, index) => (
                        <ListItem key={text} disablePadding sx={{ display: 'block' }}>
                            <ListItemButton
                                sx={{
                                    minHeight: 48,
                                    justifyContent: open ? 'initial' : 'center',
                                    px: 1.5,
                                }}
                            >
                                <ListItemIcon
                                    sx={{
                                        minWidth: 0,
                                        mr: open ? 3 : 'auto',
                                        justifyContent: 'center',
                                        // opacity: open ? 1 : 0
                                    }}
                                >
                                    {index % 2 === 0 ? <ListItemIcon
                                    sx={{
                                        minWidth: 0,
                                        mr: open ? 3 : 'auto',
                                        justifyContent: 'center',
                                        // opacity: open ? 1 : 0
                                    }}
                                >
                                    <GoogleIcon></GoogleIcon>
                                </ListItemIcon> : <ListItemIcon
                                    sx={{
                                        minWidth: 0,
                                        mr: open ? 3 : 'auto',
                                        justifyContent: 'center',
                                        // opacity: open ? 1 : 0
                                    }}
                                >
                                    <CloudIcon></CloudIcon>
                                </ListItemIcon>}
                                </ListItemIcon>
                                <ListItemText primaryTypographyProps={{fontSize: '15px'}} 
 primary={text} sx={{ opacity: open ? 1 :0 }} />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
                <Divider />
                {['Analysis'].map((text, index) => (
                        <ListItem key={text} disablePadding sx={{ pt : 1, display: 'block' }}>
                            <ListItemButton
                                sx={{
                                    minHeight: 48,
                                    justifyContent: open ? 'initial' : 'center',
                                    px: 1.5,
                                    // backgroundColor: open ? "#E1E1E1" : '' , 
                                    backgroundColor:"#E1E1E1" , 
                                }}
                            >
                                <ListItemIcon
                                    sx={{
                                        minWidth: 0,
                                        mr: open ? 3 : 'auto',
                                        justifyContent: 'center',
                                        // opacity: open ? 1 : 0
                                    }}
                                >
                                    <InsightsIcon></InsightsIcon>
                                </ListItemIcon>
                                <ListItemText primaryTypographyProps={{fontSize: '15px'}}  primary={text} sx={{  opacity: open ? 1 : 0 }} />
                            </ListItemButton>
                        </ListItem>
                    ))}
                <List>
                    {['Redundant Sharing', 'Deviant Sharing', 'File-folder Sharing Differences', 'Sharing changes'].map((text, index) => (
                        <ListItem key={text} disablePadding sx={{ display: 'block' }}>
                                <ListItemButton
                                    sx={{
                                        minHeight: 48,
                                        justifyContent: open ? 'initial' : 'center',
                                        px: 1.5,
                                    }}

                                    onClick=
                                        {text === "Redundant Sharing" ? navigateRedundantSharing :
                                            text === "Deviant Sharing" ? navigateDeviantSharing :
                                                text === "File-folder Sharing Differences" ? navigateFileFolderSharing :
                                                    navigateSharingChanges
                                        }
                                >
                                    <ListItemIcon
                                    sx={{
                                        minWidth: 0,
                                        mr: open ? 3 : 'auto',
                                        justifyContent: 'center',
                                        // opacity: open ? 1 : 0
                                    }}
                                >
                                    <FolderOpenIcon></FolderOpenIcon>
                                </ListItemIcon>
                                    <ListItemText primaryTypographyProps={{fontSize: '15px'}} primary={text}
                                                  sx={{opacity: open ? 1 : 0}}/>
                                </ListItemButton>
                        </ListItem>
                    ))}
                </List>
                <Divider />
                {['Setting'].map((text, index) => (
                    <ListItem key={text} disablePadding sx={{ pt : 1, display: 'block' }}>
                        <ListItemButton
                            sx={{
                                minHeight: 48,
                                justifyContent: open ? 'initial' : 'center',
                                px: 1.5,
                                // backgroundColor: open ? "#E1E1E1" : '' ,
                                backgroundColor: "#E1E1E1" ,
                            }}
                        >
                            <ListItemIcon
                                    sx={{
                                        minWidth: 0,
                                        mr: open ? 3 : 'auto',
                                        justifyContent: 'center',
                                        // opacity: open ? 1 : 0
                                    }}
                                >
                                    <SettingsIcon></SettingsIcon>
                                </ListItemIcon>
                            <ListItemText primaryTypographyProps={{fontSize: '15px'}}  primary={text} sx={{  opacity: open ? 1 : 0 }} />
                        </ListItemButton>
                    </ListItem>
                ))}
                <List>
                    {['My Profile', 'Access Control Policy'].map((text, index) => (
                        <ListItem key={text} disablePadding sx={{ display: 'block' }}>
                                <ListItemButton
                                    sx={{
                                        minHeight: 48,
                                        justifyContent: open ? 'initial' : 'center',
                                        px: 1.5,
                                    }}
                                    onClick={ text === "Access Control Policy" ? navigateAccessControl :navigateMyProfile }
                                >
                                    <ListItemIcon
                                    sx={{
                                        minWidth: 0,
                                        mr: open ? 3 : 'auto',
                                        justifyContent: 'center',
                                        // opacity: open ? 1 : 0
                                    }}
                                >
                                    <PermIdentityIcon></PermIdentityIcon>
                                </ListItemIcon>
                                <ListItemText primaryTypographyProps={{fontSize: '15px'}}  primary={text} sx={{  opacity: open ? 1 : 0 }} />
                                </ListItemButton>
                        </ListItem>
                    ))}
                </List>
            </Drawer>
            <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                <DrawerHeader />
                {/*Here to Start flexible components*/}
                {props.type === "home"?
                    <>
                        <HomeHeader snapShotData = {props.components} userData={props.userData} handleOpenModal={handleOpenModal} handleCloseModal={handleCloseModal} openModal={openModal} handleCloseModal={handleCloseModal}/>
                    <div style={{display:"grid"}}>
                        <SideBarFileInfo/>
                        {twoD_Array.map( (file,idx) =>{
                            return (
                                <Box component="main" sx={{flexGrow: 1, p: 3}} style={{margin:"0px",padding:"0px",display: "inline-flex"}}>
                                    <MultiActionAreaCard dataList={file}/>
                                </Box>
                                )
                        })
                        }
                    </div>
                    </>
                    :
                    <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                        {
                            props.components.map((element) => (
                                element
                            ))
                        }
                    </Box>
                }
            </Box>
        </Box>
    );
}
