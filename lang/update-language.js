// Hàm kiểm tra đối tượng có là object
function isObject(a) {
    return (!!a) && (a.constructor === Object);
}

function assignValueToObject(obj, path, value) {
    const keys = path.split('.');
    let currentObj = obj;
    for (let i = 0; i < keys.length - 1; i++) {
        if (!currentObj[keys[i]]) {
            currentObj[keys[i]] = {};
        }
        currentObj = currentObj[keys[i]];
    }
    currentObj[keys[keys.length - 1]] = value;
    return obj;
}

function processData(obj1, obj2, path = '', output = {}, missing_output = {}) {
    // eslint-disable-next-line guard-for-in
    for (const key in obj1) {
        // Lọc qua các key trong file en và tạo ra chuỗi nối key
        const newPath = path === '' ? key : `${path}.${key}`;
        if (isObject(obj1[key])) {
            let obj = {};
            if (obj2.hasOwnProperty(key)) obj = obj2[key];
            processData(obj1[key], obj, newPath, output, missing_output);
        } else if (!obj2.hasOwnProperty(key)) {
            // eslint-disable-next-line no-param-reassign
            missing_output = assignValueToObject(missing_output, newPath, obj1[key]);
        } else {
            // eslint-disable-next-line no-param-reassign
            output = assignValueToObject(output, newPath, obj2[key]);
        }
    }
    return { output, missing_output };
}

async function copyFiles(filesCornerstone, langCornerstore, files, langFolder) {
    const fs = require('fs');
    const path = require('path');
    for (const fileCornerstone of filesCornerstone) {
        const filePathCornerstone = path.join(langCornerstore, fileCornerstone);
        const statCornerstone = fs.lstatSync(filePathCornerstone);
        if (statCornerstone.isFile()) {
            const fileLangExists = files.includes(fileCornerstone);
            if (!fileLangExists) {
                const filePathLang = path.join(langFolder, fileCornerstone);
                fs.copyFileSync(filePathCornerstone, filePathLang);
                console.log(`Copied file: ${filePathCornerstone}`);
            }
        }
    }
}

async function updateLanguage() {
    try {
        const langFolder = './';
        const outputFolder = './lang_output/';
        const baseLang = 'en.json';
        const langCornerstore = '../lang-cornerstone';
        const fs = require('fs');
        // eslint-disable-next-line import/no-extraneous-dependencies
        const merge = require('deepmerge');


        // Kiểm tra outputFolder có tồn tại không nếu chưa thì tạo output
        // eslint-disable-next-line no-unused-expressions
        !fs.existsSync(outputFolder) && fs.mkdirSync(outputFolder);

        // Lọc qua tất cả các file trong lang ngoại trừ các file có đuôi như bên dưới
        let filesCornerstone = fs.readdirSync(langCornerstore);
        filesCornerstone = filesCornerstone.filter(fileCornerstone => !/en.json$/.test(fileCornerstone));
        let files = fs.readdirSync(langFolder);
        files = files.filter(file => !/-mine.json$|-untranslated.json$|-output.json|.js$/.test(file));

        await copyFiles(filesCornerstone, langCornerstore, files, langFolder);

        console.log('true :>> ', true);
        // Kiểm tra xem file en.json có trong folder lang
        const index = files.findIndex(file => file === baseLang);
        // eslint-disable-next-line no-throw-literal
        if (index < 0) throw `${baseLang} is not found in lang`;

        // Đọc dữ liệu trong file en.json và chuyển qua định dạng json
        let baseData = fs.readFileSync(langFolder + baseLang).toString();
        baseData = JSON.parse(baseData);


        // Duyệt qua các file trong thư mục lang trừ file en.json
        files.forEach(file => {
            if (!fs.lstatSync(langFolder + file).isFile()) return false;
            if (file === baseLang) return false;
            // Đọc nội dung tất cả các file trong thư mục lang, chuyển qua json
            let targetData = fs.readFileSync(langFolder + file).toString();
            targetData = JSON.parse(targetData);
            let { output: output_translated, missing_output: output_untranslated } = processData(baseData, targetData);

            const my_translated_file = `${file.replace(/\.json$/, '') }-mine.json`;
            if (fs.existsSync(my_translated_file)) {
                let my_translated_data = fs.readFileSync(my_translated_file).toString();
                my_translated_data = JSON.parse(my_translated_data);
                const {
                    output: translated,
                    missing_output: untranslated,
                } = processData(output_untranslated, my_translated_data);
                output_translated = merge(output_translated, translated);
                output_untranslated = untranslated;
            }

            const output_translated_file = file;
            fs.writeFileSync(output_translated_file, JSON.stringify(output_translated));
            const output_untranslated_file = `${file.replace(/\.json$/, '') }-untranslated.json`;
            fs.writeFileSync(outputFolder + output_untranslated_file, JSON.stringify(output_untranslated));
        });
        console.log('Hoàn thành!');
    } catch (e) {
        console.log('=== exception ===');
        console.log(e);
    }
}

updateLanguage();
