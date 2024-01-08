use std::collections::HashMap;
use std::fs::File;
use std::io::Write;
use std::path::Path;
use std::{env, fs};
fn get_file_type(file_name: &str) -> &str {
    let file_name_array: Vec<&str> = file_name.split('.').collect();
    file_name_array.last().copied().unwrap_or("")
}

fn get_file_types_and_content(dir_path: &str) -> HashMap<String, String> {
    let mut file_type_and_file_content: HashMap<String, String> = HashMap::new();
    if let Ok(entries) = fs::read_dir(dir_path) {
        for entry in entries.flatten() {
            if let Ok(metadata) = entry.metadata() {
                if metadata.is_dir() {
                    println!("Found Dir.. Ignoring");
                    continue;
                }
                let file_name = entry.file_name();
                let file_name_lossy = file_name.to_string_lossy();
                println!("{}", &file_name_lossy);

                let file_type = get_file_type(&file_name_lossy);

                println!("File Type: {}", file_type);

                if let Ok(file_content) = fs::read_to_string(entry.path()) {
                    file_type_and_file_content
                        .insert(file_type.to_string(), file_content.to_string());
                } else {
                    eprintln!("Error reading file: {}", file_name_lossy);
                }
            }
        }
    } else {
        eprintln!("Error reading directory: {}", dir_path);
    }

    file_type_and_file_content
}
fn verify_files(files: HashMap<String, String>) -> Result<Vec<(String, String)>, &'static str> {
    let allowed_extensions = ["html", "css", "js"];

    let mut filtered_files: Vec<(String, String)> = files
        .into_iter()
        .filter(|(key, _)| {
            let file_extension = key
                .split('.')
                .last()
                .map(|ext| ext.to_lowercase())
                .unwrap_or_default();
            allowed_extensions.contains(&file_extension.as_str())
        })
        .collect();

    // Sort the vector based on the order: html, css, js
    filtered_files.sort_by(|a, b| {
        let ext_a = a.0.split('.').last().unwrap_or_default();
        let ext_b = b.0.split('.').last().unwrap_or_default();

        let order_a = match ext_a {
            "html" => 0,
            "css" => 1,
            "js" => 2,
            _ => usize::MAX, // Put unknown extensions at the end
        };

        let order_b = match ext_b {
            "html" => 0,
            "css" => 1,
            "js" => 2,
            _ => usize::MAX,
        };

        order_a.cmp(&order_b)
    });

    if filtered_files.len() != 3 {
        Err("Too many files")
    } else {
        Ok(filtered_files)
    }
}

fn main() {
    let args: Vec<String> = env::args().collect();

    if args.len() < 2 {
        eprintln!("Usage: <directory_path>");
        return;
    }

    let dir_path = &args[1];
    let files = get_file_types_and_content(&dir_path);
    let verified_files = verify_files(files.clone()); // Returns a result if okay its hashmap of string,string

    match verified_files {
        Ok(files) => {
            for (key, value) in files.iter() {
                println!("Key: {}, Value: {}", key, value);
            }

            let html = match files.iter().find(|(key, _)| key == "html") {
                Some((_, value)) => value,
                None => {
                    eprintln!("Error: HTML file not found");
                    return;
                }
            };

            let css = match files.iter().find(|(key, _)| key == "css") {
                Some((_, value)) => value,
                None => {
                    eprintln!("Error: CSS file not found");
                    return;
                }
            };

            let js = match files.iter().find(|(key, _)| key == "js") {
                Some((_, value)) => value,
                None => {
                    eprintln!("Error: JS file not found");
                    return;
                }
            };

            let compiled_html = html
                .replace(
                    "<!-- CSSPLACEHOLDER -->",
                    &format!("<style>\n{}\n</style>", css).as_str(),
                )
                .replace(
                    "<!-- JSPLACEHOLDER -->",
                    &format!("<script>\n{}\n</script>", js).as_str(),
                );
            let compiled_file_name = "compiled.html";
            let parent_dir = Path::new(&dir_path).parent().unwrap_or_else(|| {
                eprintln!("Error getting parent directory for: {}", &dir_path);
                std::process::exit(1);
            });
            let file_path = parent_dir.join(compiled_file_name);

            // Attempt to create a new file or truncate an existing file
            let mut file = match File::create(&file_path) {
                Ok(file) => file,
                Err(err) => {
                    eprintln!("Error creating file {}: {}", &file_path.display(), err);
                    std::process::exit(1);
                }
            };

            // Write the compiled HTML to the file
            match file.write_all(compiled_html.as_bytes()) {
                Ok(_) => println!("File written successfully: {}", &file_path.display()),
                Err(err) => eprintln!("Error writing to file {}: {}", &file_path.display(), err),
            }
        }
        Err(err) => eprintln!("Error: {}", err),
    }
}
