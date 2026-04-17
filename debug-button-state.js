// Debug script to check button state issues

// Simulate the React state from TaskAllocation
let formData = {
    title: '',
    description: '',
    priority: 'medium',
    requiredSkills: [],
    estimatedHours: 4,
    deadline: ''
};

let skillInput = '';
let skillSuggestions = [];
let assigning = false;

// Simulate the skill input functions
function handleSkillInputChange(value) {
    skillInput = value;
    
    // Filter suggestions based on input (from the actual code)
    const skills = ['JavaScript', 'Python', 'React', 'Node.js', 'Design', 'Testing', 'DevOps', 'Data Analysis'];
    
    if (value.length > 0) {
        skillSuggestions = skills.filter(skill => 
            skill.toLowerCase().includes(value.toLowerCase()) &&
            !formData.requiredSkills.includes(skill)
        );
    } else {
        skillSuggestions = [];
    }
    
    console.log(`Skill input changed to: "${value}"`);
    console.log(`Suggestions: [${skillSuggestions.join(', ')}]`);
    console.log(`Current requiredSkills: [${formData.requiredSkills.join(', ')}]`);
}

function addSkill(skill) {
    if (skill && !formData.requiredSkills.includes(skill)) {
        formData.requiredSkills = [...formData.requiredSkills, skill];
        console.log(`Added skill: ${skill}`);
        console.log(`Updated requiredSkills: [${formData.requiredSkills.join(', ')}]`);
    }
    skillInput = '';
    skillSuggestions = [];
}

function handleTitleChange(value) {
    formData.title = value;
    console.log(`Title changed to: "${value}"`);
}

// Check button disabled state
function checkButtonState() {
    const disabled = !formData.title || formData.requiredSkills.length === 0 || assigning;
    console.log(`\nButton State Check:`);
    console.log(`  Title: "${formData.title}" (empty: ${!formData.title})`);
    console.log(`  RequiredSkills length: ${formData.requiredSkills.length} (empty: ${formData.requiredSkills.length === 0})`);
    console.log(`  Assigning: ${assigning}`);
    console.log(`  Buttons disabled: ${disabled}`);
    
    if (disabled) {
        console.log(`\nButtons are DISABLED because:`);
        if (!formData.title) console.log(`  - No title provided`);
        if (formData.requiredSkills.length === 0) console.log(`  - No skills provided`);
        if (assigning) console.log(`  - Currently assigning`);
    } else {
        console.log(`\nButtons are ENABLED!`);
    }
}

// Test the flow
console.log('=== Testing Button State Debugging ===\n');

// Test 1: Initial state
console.log('1. Initial state:');
checkButtonState();

// Test 2: Add title only
console.log('\n2. Adding title only:');
handleTitleChange('Test Task');
checkButtonState();

// Test 3: Add skills via typing
console.log('\n3. Typing skill "React":');
handleSkillInputChange('React');
checkButtonState();

// Test 4: Select skill from suggestions
console.log('\n4. Selecting skill from suggestions:');
addSkill('React');
checkButtonState();

// Test 5: Add another skill
console.log('\n5. Adding another skill:');
addSkill('JavaScript');
checkButtonState();

// Test 6: Remove title
console.log('\n6. Removing title:');
handleTitleChange('');
checkButtonState();

// Test 7: Add title back
console.log('\n7. Adding title back:');
handleTitleChange('Complete Test Task');
checkButtonState();

// Test 8: Remove all skills
console.log('\n8. Removing all skills:');
formData.requiredSkills = [];
checkButtonState();

console.log('\n=== Debug Complete ===');
