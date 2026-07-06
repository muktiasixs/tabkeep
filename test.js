const str = 'https://www.canva.com/design/DAG54VTABEo/dm2VHT4HWY0bbyBMCrDz7Q/edit | CV Dermagani Muktiasa - A4';
const regex = /^(\S+)\s*\|\s*(.*)$/;
console.log(str.match(regex));
