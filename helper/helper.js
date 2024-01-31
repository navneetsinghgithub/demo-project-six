const checkvalidation = async (v) => {
  try {
    const matched = await v.check();
    if (!matched) {
      let error_respons = Object.values(v.errors || {})
        .map(error => error.message)

      return error_respons.join(",")
    }
  } catch (error) {
    console.log(error, "validation error");
    return "validator error"
  }

}

const imageUpload = (file, folder = "users") => {
  console.log(file, "qqqqqqqqqqqqq");
  let file_name_string = file.name;
  var file_name_array = file_name_string.split(".");
  var file_ext = file_name_array[1];
  var letters = "ABCDE1234567890FGHJK1234567890MNPQRSTUXY";
  var result = "";
  while (result.length < 28) {
    var rand_int = Math.floor(Math.random() * 19 + 1);
    var rand_chr = letters[rand_int];
    if (result.substr(-1, 1) != rand_chr) result += rand_chr;
  }
  var resultExt = `${result}.${file_ext}`;
  console.log(resultExt, "resultExt");
  file.mv(`public/images/${folder}/${result}.${file_ext}`);
  return resultExt;
};

module.exports = { checkvalidation, imageUpload };