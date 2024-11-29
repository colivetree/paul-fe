import React from 'react';
import { 
    List, ListItem, ListItemText, Typography, 
    Collapse, IconButton, Box 
} from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';

const DocumentSection = ({ section, depth = 0 }) => {
    const [expanded, setExpanded] = React.useState(false);

    const handleExpand = () => {
        setExpanded(!expanded);
    };

    return (
        <>
            <ListItem 
                sx={{ 
                    pl: depth * 2,
                    borderLeft: depth > 0 ? '1px solid rgba(0,0,0,0.1)' : 'none'
                }}
            >
                {section.children?.length > 0 && (
                    <IconButton size="small" onClick={handleExpand}>
                        {expanded ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                )}
                <ListItemText
                    primary={section.title}
                    secondary={
                        <Box>
                            <Typography variant="body2" color="text.secondary">
                                {section.content.substring(0, 100)}...
                            </Typography>
                            {section.has_tables && (
                                <Typography variant="caption" color="primary">
                                    Contains tables
                                </Typography>
                            )}
                            {section.has_figures && (
                                <Typography variant="caption" color="secondary">
                                    Contains figures
                                </Typography>
                            )}
                        </Box>
                    }
                />
            </ListItem>
            {section.children?.length > 0 && (
                <Collapse in={expanded}>
                    <List>
                        {section.children.map((child, index) => (
                            <DocumentSection 
                                key={index} 
                                section={child} 
                                depth={depth + 1} 
                            />
                        ))}
                    </List>
                </Collapse>
            )}
        </>
    );
};

const DocumentDisplay = ({ sections }) => {
    // Organize sections into hierarchy
    const buildHierarchy = (sections) => {
        const hierarchy = [];
        const sectionMap = new Map();
        
        // First pass: create map of all sections
        sections.forEach(section => {
            sectionMap.set(section.id, { ...section, children: [] });
        });
        
        // Second pass: build hierarchy
        sections.forEach(section => {
            const sectionWithChildren = sectionMap.get(section.id);
            if (section.parent_id) {
                const parent = sectionMap.get(section.parent_id);
                if (parent) {
                    parent.children.push(sectionWithChildren);
                }
            } else {
                hierarchy.push(sectionWithChildren);
            }
        });
        
        return hierarchy;
    };

    const hierarchicalSections = buildHierarchy(sections);

    return (
        <List>
            {hierarchicalSections.map((section, index) => (
                <DocumentSection key={index} section={section} />
            ))}
        </List>
    );
};

export default DocumentDisplay; 